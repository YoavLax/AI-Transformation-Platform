from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from database import get_db
from db_models import ModelCardModel, RiskModel, RiskCategory as DBRiskCategory, RiskSeverity as DBRiskSeverity
from repositories import GovernanceRepository
from models import (
    ModelCard, ModelCardCreate, Risk, RiskCategory, 
    RiskSeverity, EvaluationMetric
)

router = APIRouter()


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


def db_to_model_card(card: ModelCardModel) -> ModelCard:
    """Convert database model to Pydantic model"""
    risks = [
        Risk(
            category=RiskCategory(r.category.value),
            description=r.description,
            severity=RiskSeverity(r.severity.value),
            mitigation=r.mitigation
        )
        for r in card.risks
    ]
    
    metrics = [
        EvaluationMetric(**m) for m in (card.evaluation_metrics or [])
    ]
    
    return ModelCard(
        id=card.id,
        model_name=card.model_name,
        version=card.version,
        purpose=card.purpose,
        owner=card.owner,
        training_data=card.training_data,
        evaluation_metrics=metrics,
        risks=risks,
        mitigations=card.mitigations or [],
        created_at=card.created_at,
        updated_at=card.updated_at
    )


@router.get("/", response_model=List[ModelCard])
async def get_model_cards(db: Session = Depends(get_db)):
    """Get all model cards"""
    repo = GovernanceRepository(db)
    cards = repo.get_all_with_risks()
    return [db_to_model_card(card) for card in cards]


@router.get("/risks/heatmap")
async def get_risk_heatmap(db: Session = Depends(get_db)):
    """Get risk data formatted for heatmap visualization"""
    repo = GovernanceRepository(db)
    return repo.get_risk_heatmap()


@router.get("/risks/summary")
async def get_risk_summary(db: Session = Depends(get_db)):
    """Get summary of all risks across models"""
    repo = GovernanceRepository(db)
    return repo.get_risk_summary()


@router.get("/{card_id}", response_model=ModelCard)
async def get_model_card(card_id: str, db: Session = Depends(get_db)):
    """Get a specific model card by ID"""
    repo = GovernanceRepository(db)
    card = repo.get_with_risks(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Model card not found")
    return db_to_model_card(card)


@router.post("/", response_model=ModelCard)
async def create_model_card(data: ModelCardCreate, db: Session = Depends(get_db)):
    """Create a new model card"""
    repo = GovernanceRepository(db)
    card_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    risks = assess_risks(data)
    metrics = generate_default_metrics()
    
    db_card = ModelCardModel(
        id=card_id,
        model_name=data.model_name,
        version=data.version,
        purpose=data.purpose,
        owner=data.owner,
        training_data=data.training_data,
        evaluation_metrics=[m.model_dump() for m in metrics],
        mitigations=[r.mitigation for r in risks if r.mitigation],
        created_at=now,
        updated_at=now
    )
    
    repo.create(db_card)
    
    # Add risks
    for risk in risks:
        repo.add_risk(
            card_id,
            DBRiskCategory(risk.category.value),
            risk.description,
            DBRiskSeverity(risk.severity.value),
            risk.mitigation
        )
    
    # Refresh to get risks
    card = repo.get_with_risks(card_id)
    return db_to_model_card(card)


@router.put("/{card_id}", response_model=ModelCard)
async def update_model_card(card_id: str, data: ModelCardCreate, db: Session = Depends(get_db)):
    """Update an existing model card"""
    repo = GovernanceRepository(db)
    existing = repo.get(card_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Model card not found")
    
    existing.model_name = data.model_name
    existing.version = data.version
    existing.purpose = data.purpose
    existing.owner = data.owner
    existing.training_data = data.training_data
    existing.updated_at = datetime.utcnow()
    
    repo.update(existing)
    
    card = repo.get_with_risks(card_id)
    return db_to_model_card(card)


@router.patch("/{card_id}/risks")
async def update_model_risks(card_id: str, risks: List[Risk], db: Session = Depends(get_db)):
    """Update risks for a model card"""
    repo = GovernanceRepository(db)
    if not repo.exists(card_id):
        raise HTTPException(status_code=404, detail="Model card not found")
    
    risks_data = [
        {
            "category": r.category,
            "description": r.description,
            "severity": r.severity,
            "mitigation": r.mitigation
        }
        for r in risks
    ]
    
    card = repo.update_risks(card_id, risks_data)
    return db_to_model_card(card)


@router.patch("/{card_id}/metrics")
async def update_model_metrics(card_id: str, metrics: List[EvaluationMetric], db: Session = Depends(get_db)):
    """Update evaluation metrics for a model card"""
    repo = GovernanceRepository(db)
    existing = repo.get(card_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Model card not found")
    
    existing.evaluation_metrics = [m.model_dump() for m in metrics]
    existing.updated_at = datetime.utcnow()
    
    repo.update(existing)
    
    card = repo.get_with_risks(card_id)
    return db_to_model_card(card)


@router.delete("/{card_id}")
async def delete_model_card(card_id: str, db: Session = Depends(get_db)):
    """Delete a model card"""
    repo = GovernanceRepository(db)
    if not repo.exists(card_id):
        raise HTTPException(status_code=404, detail="Model card not found")
    
    repo.delete(card_id)
    return {"message": "Model card deleted successfully"}


@router.post("/{card_id}/risks/assess")
async def trigger_risk_assessment(card_id: str, db: Session = Depends(get_db)):
    """Trigger a new risk assessment for a model"""
    repo = GovernanceRepository(db)
    existing = repo.get(card_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Model card not found")
    
    # Re-assess risks
    new_risks = assess_risks(ModelCardCreate(
        model_name=existing.model_name,
        version=existing.version,
        purpose=existing.purpose,
        owner=existing.owner,
        training_data=existing.training_data
    ))
    
    risks_data = [
        {
            "category": r.category,
            "description": r.description,
            "severity": r.severity,
            "mitigation": r.mitigation
        }
        for r in new_risks
    ]
    
    repo.update_risks(card_id, risks_data)
    
    return {
        "message": "Risk assessment completed",
        "risks": new_risks
    }
