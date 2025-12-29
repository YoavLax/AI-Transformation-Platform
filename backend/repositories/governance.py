"""
Governance repository for database operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from db_models import ModelCardModel, RiskModel, RiskCategory, RiskSeverity
from .base import BaseRepository
import uuid


class GovernanceRepository(BaseRepository[ModelCardModel]):
    """Repository for model card and governance operations."""
    
    def __init__(self, db: Session):
        super().__init__(ModelCardModel, db)
    
    def get_with_risks(self, id: str) -> Optional[ModelCardModel]:
        """Get a model card with its risks loaded."""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_all_with_risks(self) -> List[ModelCardModel]:
        """Get all model cards with risks loaded."""
        return self.db.query(self.model).all()
    
    def get_by_owner(self, owner: str) -> List[ModelCardModel]:
        """Get all model cards by owner."""
        return self.db.query(self.model).filter(
            self.model.owner.ilike(f"%{owner}%")
        ).all()
    
    def add_risk(
        self,
        model_card_id: str,
        category: RiskCategory,
        description: str,
        severity: RiskSeverity,
        mitigation: Optional[str] = None
    ) -> Optional[RiskModel]:
        """Add a risk to a model card."""
        model_card = self.get(model_card_id)
        if not model_card:
            return None
        
        risk = RiskModel(
            id=str(uuid.uuid4()),
            model_card_id=model_card_id,
            category=category,
            description=description,
            severity=severity,
            mitigation=mitigation
        )
        self.db.add(risk)
        self.db.commit()
        self.db.refresh(risk)
        return risk
    
    def update_risks(self, model_card_id: str, risks_data: List[dict]) -> Optional[ModelCardModel]:
        """Replace all risks for a model card."""
        model_card = self.get(model_card_id)
        if not model_card:
            return None
        
        # Delete existing risks
        self.db.query(RiskModel).filter(RiskModel.model_card_id == model_card_id).delete()
        
        # Add new risks
        for risk_data in risks_data:
            risk = RiskModel(
                id=str(uuid.uuid4()),
                model_card_id=model_card_id,
                category=risk_data.get("category"),
                description=risk_data.get("description", ""),
                severity=risk_data.get("severity", RiskSeverity.medium),
                mitigation=risk_data.get("mitigation")
            )
            self.db.add(risk)
        
        # Update mitigations on model card
        model_card.mitigations = [
            r.get("mitigation") for r in risks_data if r.get("mitigation")
        ]
        
        self.db.commit()
        self.db.refresh(model_card)
        return model_card
    
    def get_risk_summary(self) -> dict:
        """Get summary of all risks across model cards."""
        model_cards = self.get_all_with_risks()
        
        summary = {
            "total_models": len(model_cards),
            "total_risks": 0,
            "by_category": {},
            "by_severity": {},
            "high_priority": []
        }
        
        for card in model_cards:
            for risk in card.risks:
                summary["total_risks"] += 1
                
                cat = risk.category.value
                sev = risk.severity.value
                
                summary["by_category"][cat] = summary["by_category"].get(cat, 0) + 1
                summary["by_severity"][sev] = summary["by_severity"].get(sev, 0) + 1
                
                if risk.severity in [RiskSeverity.critical, RiskSeverity.high]:
                    summary["high_priority"].append({
                        "model": card.model_name,
                        "risk": {
                            "category": cat,
                            "description": risk.description,
                            "severity": sev,
                            "mitigation": risk.mitigation
                        }
                    })
        
        return summary
    
    def get_risk_heatmap(self) -> List[dict]:
        """Get risk data formatted for heatmap visualization."""
        model_cards = self.get_all_with_risks()
        heatmap_data = {}
        
        for card in model_cards:
            for risk in card.risks:
                key = f"{risk.category.value}_{risk.severity.value}"
                if key not in heatmap_data:
                    heatmap_data[key] = {
                        "category": risk.category.value,
                        "severity": risk.severity.value,
                        "count": 0,
                        "models": []
                    }
                heatmap_data[key]["count"] += 1
                heatmap_data[key]["models"].append(card.model_name)
        
        return list(heatmap_data.values())
