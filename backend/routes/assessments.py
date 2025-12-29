from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from database import get_db
from db_models import AssessmentModel
from repositories import AssessmentRepository
from models import Assessment, AssessmentCreate, AssessmentScores

router = APIRouter()


def generate_recommendations(scores: AssessmentScores) -> List[str]:
    """Generate recommendations based on assessment scores"""
    recommendations = []
    
    if scores.data_readiness < 3:
        recommendations.append("Invest in data quality and governance frameworks")
        recommendations.append("Establish centralized data catalog and metadata management")
    
    if scores.technology < 3:
        recommendations.append("Modernize technology infrastructure for AI/ML workloads")
        recommendations.append("Evaluate cloud-native AI platforms")
    
    if scores.talent < 3:
        recommendations.append("Develop AI/ML training programs for existing staff")
        recommendations.append("Consider strategic hiring for key AI roles")
    
    if scores.governance < 3:
        recommendations.append("Implement AI ethics framework and review processes")
        recommendations.append("Establish model documentation standards")
    
    if scores.business_alignment < 3:
        recommendations.append("Create AI strategy aligned with business objectives")
        recommendations.append("Develop use case prioritization framework")
    
    # Add general recommendations
    if sum([scores.data_readiness, scores.technology, scores.talent, 
            scores.governance, scores.business_alignment]) / 5 < 3:
        recommendations.append("Consider starting with small, high-impact pilot projects")
        recommendations.append("Establish AI Center of Excellence to drive adoption")
    else:
        recommendations.append("Focus on scaling successful AI initiatives")
        recommendations.append("Implement MLOps practices for production deployments")
    
    return recommendations[:6]  # Return top 6 recommendations


@router.get("/", response_model=List[Assessment])
async def get_assessments(db: Session = Depends(get_db)):
    """Get all assessments"""
    repo = AssessmentRepository(db)
    assessments = repo.get_all()
    return [
        Assessment(
            id=a.id,
            organization_id=a.organization_id,
            organization_name=a.organization_name,
            date=a.date,
            scores=AssessmentScores(**a.scores),
            recommendations=a.recommendations or []
        )
        for a in assessments
    ]


@router.get("/{assessment_id}", response_model=Assessment)
async def get_assessment(assessment_id: str, db: Session = Depends(get_db)):
    """Get a specific assessment by ID"""
    repo = AssessmentRepository(db)
    a = repo.get(assessment_id)
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return Assessment(
        id=a.id,
        organization_id=a.organization_id,
        organization_name=a.organization_name,
        date=a.date,
        scores=AssessmentScores(**a.scores),
        recommendations=a.recommendations or []
    )


@router.post("/", response_model=Assessment)
async def create_assessment(data: AssessmentCreate, db: Session = Depends(get_db)):
    """Create a new assessment"""
    repo = AssessmentRepository(db)
    
    assessment_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    recommendations = generate_recommendations(data.scores)
    
    db_assessment = AssessmentModel(
        id=assessment_id,
        organization_id=org_id,
        organization_name=data.organization_name,
        date=datetime.utcnow(),
        scores=data.scores.model_dump(),
        recommendations=recommendations
    )
    
    repo.create(db_assessment)
    
    return Assessment(
        id=db_assessment.id,
        organization_id=db_assessment.organization_id,
        organization_name=db_assessment.organization_name,
        date=db_assessment.date,
        scores=data.scores,
        recommendations=recommendations
    )


@router.put("/{assessment_id}", response_model=Assessment)
async def update_assessment(assessment_id: str, data: AssessmentCreate, db: Session = Depends(get_db)):
    """Update an existing assessment"""
    repo = AssessmentRepository(db)
    existing = repo.get(assessment_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    recommendations = generate_recommendations(data.scores)
    
    existing.organization_name = data.organization_name
    existing.date = datetime.utcnow()
    existing.scores = data.scores.model_dump()
    existing.recommendations = recommendations
    
    repo.update(existing)
    
    return Assessment(
        id=existing.id,
        organization_id=existing.organization_id,
        organization_name=existing.organization_name,
        date=existing.date,
        scores=data.scores,
        recommendations=recommendations
    )


@router.delete("/{assessment_id}")
async def delete_assessment(assessment_id: str, db: Session = Depends(get_db)):
    """Delete an assessment"""
    repo = AssessmentRepository(db)
    if not repo.exists(assessment_id):
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    repo.delete(assessment_id)
    return {"message": "Assessment deleted successfully"}


@router.get("/organization/{org_name}", response_model=List[Assessment])
async def get_assessments_by_organization(org_name: str, db: Session = Depends(get_db)):
    """Get all assessments for a specific organization"""
    repo = AssessmentRepository(db)
    assessments = repo.get_by_organization(org_name)
    return [
        Assessment(
            id=a.id,
            organization_id=a.organization_id,
            organization_name=a.organization_name,
            date=a.date,
            scores=AssessmentScores(**a.scores),
            recommendations=a.recommendations or []
        )
        for a in assessments
    ]
