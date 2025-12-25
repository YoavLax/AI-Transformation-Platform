from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid

from models import Assessment, AssessmentCreate, AssessmentScores

router = APIRouter()

# In-memory storage (simulating localStorage on backend)
assessments_db: dict[str, Assessment] = {}


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
async def get_assessments():
    """Get all assessments"""
    return list(assessments_db.values())


@router.get("/{assessment_id}", response_model=Assessment)
async def get_assessment(assessment_id: str):
    """Get a specific assessment by ID"""
    if assessment_id not in assessments_db:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessments_db[assessment_id]


@router.post("/", response_model=Assessment)
async def create_assessment(data: AssessmentCreate):
    """Create a new assessment"""
    assessment_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    
    recommendations = generate_recommendations(data.scores)
    
    assessment = Assessment(
        id=assessment_id,
        organization_id=org_id,
        organization_name=data.organization_name,
        date=datetime.utcnow(),
        scores=data.scores,
        recommendations=recommendations
    )
    
    assessments_db[assessment_id] = assessment
    return assessment


@router.put("/{assessment_id}", response_model=Assessment)
async def update_assessment(assessment_id: str, data: AssessmentCreate):
    """Update an existing assessment"""
    if assessment_id not in assessments_db:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    existing = assessments_db[assessment_id]
    recommendations = generate_recommendations(data.scores)
    
    updated = Assessment(
        id=assessment_id,
        organization_id=existing.organization_id,
        organization_name=data.organization_name,
        date=datetime.utcnow(),
        scores=data.scores,
        recommendations=recommendations
    )
    
    assessments_db[assessment_id] = updated
    return updated


@router.delete("/{assessment_id}")
async def delete_assessment(assessment_id: str):
    """Delete an assessment"""
    if assessment_id not in assessments_db:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    del assessments_db[assessment_id]
    return {"message": "Assessment deleted successfully"}


@router.get("/organization/{org_name}", response_model=List[Assessment])
async def get_assessments_by_organization(org_name: str):
    """Get all assessments for a specific organization"""
    return [a for a in assessments_db.values() 
            if a.organization_name.lower() == org_name.lower()]
