from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
import uuid

from models import (
    ModelCard, ModelCardCreate, Risk, RiskCategory, 
    RiskSeverity, EvaluationMetric
)

router = APIRouter()

# In-memory storage
model_cards_db: dict[str, ModelCard] = {}


def assess_risks(model_card: ModelCardCreate) -> List[Risk]:
    """Auto-generate initial risk assessments based on model info"""
    risks = []
    
    # Add default risks based on common AI concerns
    risks.append(Risk(
        category=RiskCategory.bias,
        description="Potential bias in training data that could affect model outputs",
        severity=RiskSeverity.medium,
        mitigation="Conduct regular bias audits and fairness testing"
    ))
    
    risks.append(Risk(
        category=RiskCategory.privacy,
        description="Data privacy concerns with training and inference data",
        severity=RiskSeverity.medium,
        mitigation="Implement data anonymization and access controls"
    ))
    
    risks.append(Risk(
        category=RiskCategory.operational,
        description="Model drift and performance degradation over time",
        severity=RiskSeverity.low,
        mitigation="Implement monitoring and retraining pipelines"
    ))
    
    return risks


def generate_default_metrics() -> List[EvaluationMetric]:
    """Generate default evaluation metrics"""
    return [
        EvaluationMetric(name="Accuracy", value=0.0, threshold=0.85),
        EvaluationMetric(name="Precision", value=0.0, threshold=0.80),
        EvaluationMetric(name="Recall", value=0.0, threshold=0.80),
        EvaluationMetric(name="F1 Score", value=0.0, threshold=0.82),
    ]


@router.get("/", response_model=List[ModelCard])
async def get_model_cards():
    """Get all model cards"""
    return list(model_cards_db.values())


@router.get("/risks/heatmap")
async def get_risk_heatmap():
    """Get risk data formatted for heatmap visualization"""
    heatmap_data = {}
    
    for card in model_cards_db.values():
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


@router.get("/risks/summary")
async def get_risk_summary():
    """Get summary of all risks across models"""
    summary = {
        "total_models": len(model_cards_db),
        "total_risks": 0,
        "by_category": {},
        "by_severity": {},
        "high_priority": []  # Critical and high severity risks
    }
    
    for card in model_cards_db.values():
        for risk in card.risks:
            summary["total_risks"] += 1
            
            cat = risk.category.value
            sev = risk.severity.value
            
            summary["by_category"][cat] = summary["by_category"].get(cat, 0) + 1
            summary["by_severity"][sev] = summary["by_severity"].get(sev, 0) + 1
            
            if risk.severity in [RiskSeverity.critical, RiskSeverity.high]:
                summary["high_priority"].append({
                    "model": card.model_name,
                    "risk": risk.model_dump()
                })
    
    return summary


@router.get("/{card_id}", response_model=ModelCard)
async def get_model_card(card_id: str):
    """Get a specific model card by ID"""
    if card_id not in model_cards_db:
        raise HTTPException(status_code=404, detail="Model card not found")
    return model_cards_db[card_id]


@router.post("/", response_model=ModelCard)
async def create_model_card(data: ModelCardCreate):
    """Create a new model card"""
    card_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    risks = assess_risks(data)
    metrics = generate_default_metrics()
    
    model_card = ModelCard(
        id=card_id,
        model_name=data.model_name,
        version=data.version,
        purpose=data.purpose,
        owner=data.owner,
        training_data=data.training_data,
        evaluation_metrics=metrics,
        risks=risks,
        mitigations=[risk.mitigation for risk in risks if risk.mitigation],
        created_at=now,
        updated_at=now
    )
    
    model_cards_db[card_id] = model_card
    return model_card


@router.put("/{card_id}", response_model=ModelCard)
async def update_model_card(card_id: str, data: ModelCardCreate):
    """Update an existing model card"""
    if card_id not in model_cards_db:
        raise HTTPException(status_code=404, detail="Model card not found")
    
    existing = model_cards_db[card_id]
    
    updated = ModelCard(
        id=card_id,
        model_name=data.model_name,
        version=data.version,
        purpose=data.purpose,
        owner=data.owner,
        training_data=data.training_data,
        evaluation_metrics=existing.evaluation_metrics,
        risks=existing.risks,
        mitigations=existing.mitigations,
        created_at=existing.created_at,
        updated_at=datetime.utcnow()
    )
    
    model_cards_db[card_id] = updated
    return updated


@router.patch("/{card_id}/risks")
async def update_model_risks(card_id: str, risks: List[Risk]):
    """Update risks for a model card"""
    if card_id not in model_cards_db:
        raise HTTPException(status_code=404, detail="Model card not found")
    
    existing = model_cards_db[card_id]
    
    updated = ModelCard(
        **{
            **existing.model_dump(),
            "risks": risks,
            "mitigations": [r.mitigation for r in risks if r.mitigation],
            "updated_at": datetime.utcnow()
        }
    )
    
    model_cards_db[card_id] = updated
    return updated


@router.patch("/{card_id}/metrics")
async def update_model_metrics(card_id: str, metrics: List[EvaluationMetric]):
    """Update evaluation metrics for a model card"""
    if card_id not in model_cards_db:
        raise HTTPException(status_code=404, detail="Model card not found")
    
    existing = model_cards_db[card_id]
    
    updated = ModelCard(
        **{
            **existing.model_dump(),
            "evaluation_metrics": metrics,
            "updated_at": datetime.utcnow()
        }
    )
    
    model_cards_db[card_id] = updated
    return updated


@router.delete("/{card_id}")
async def delete_model_card(card_id: str):
    """Delete a model card"""
    if card_id not in model_cards_db:
        raise HTTPException(status_code=404, detail="Model card not found")
    
    del model_cards_db[card_id]
    return {"message": "Model card deleted successfully"}


@router.post("/{card_id}/risks/assess")
async def trigger_risk_assessment(card_id: str):
    """Trigger a new risk assessment for a model"""
    if card_id not in model_cards_db:
        raise HTTPException(status_code=404, detail="Model card not found")
    
    existing = model_cards_db[card_id]
    
    # Re-assess risks (in real app, this would be more sophisticated)
    new_risks = assess_risks(ModelCardCreate(
        model_name=existing.model_name,
        version=existing.version,
        purpose=existing.purpose,
        owner=existing.owner,
        training_data=existing.training_data
    ))
    
    updated = ModelCard(
        **{
            **existing.model_dump(),
            "risks": new_risks,
            "mitigations": [r.mitigation for r in new_risks if r.mitigation],
            "updated_at": datetime.utcnow()
        }
    )
    
    model_cards_db[card_id] = updated
    
    return {
        "message": "Risk assessment completed",
        "risks": new_risks
    }
