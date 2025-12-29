from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from models import TeamMaturity, TeamMaturityCreate, TeamMaturityUpdate, MaturityScores, MaturityLevel
from database import get_db
from db_models import TeamMaturityModel, MaturityLevel as DBMaturityLevel
from repositories import MaturityRepository

router = APIRouter()


def calculate_overall_level(scores: MaturityScores) -> MaturityLevel:
    """Calculate overall maturity level based on scores"""
    avg = (scores.adoption + scores.proficiency + scores.integration + 
           scores.governance + scores.innovation) / 5
    
    if avg >= 80:
        return MaturityLevel.leading
    elif avg >= 65:
        return MaturityLevel.advanced
    elif avg >= 50:
        return MaturityLevel.proficient
    elif avg >= 35:
        return MaturityLevel.developing
    else:
        return MaturityLevel.novice


def generate_recommendations(scores: MaturityScores, strengths: List[str], improvement_areas: List[str]) -> List[str]:
    """Generate AI-driven recommendations based on scores and context"""
    recommendations = []
    
    # Adoption recommendations
    if scores.adoption < 50:
        recommendations.append("Launch an AI tools awareness campaign to increase team adoption")
        recommendations.append("Identify and train AI champions within the team to drive peer adoption")
    elif scores.adoption < 70:
        recommendations.append("Set team-wide AI tool usage targets and track progress weekly")
    
    # Proficiency recommendations
    if scores.proficiency < 50:
        recommendations.append("Implement structured AI tool training with hands-on workshops")
        recommendations.append("Create team-specific prompt libraries and best practices documentation")
    elif scores.proficiency < 70:
        recommendations.append("Establish code review guidelines that incorporate AI-generated code quality checks")
    
    # Integration recommendations
    if scores.integration < 50:
        recommendations.append("Integrate AI assistants into the team's CI/CD pipeline and development workflow")
        recommendations.append("Define standard AI tool usage patterns for common development tasks")
    elif scores.integration < 70:
        recommendations.append("Automate routine tasks using AI to demonstrate workflow integration value")
    
    # Governance recommendations
    if scores.governance < 50:
        recommendations.append("Establish clear guidelines for AI-generated code review and validation")
        recommendations.append("Implement security scanning for AI-generated code before deployment")
    elif scores.governance < 70:
        recommendations.append("Create a checklist for responsible AI usage in development")
    
    # Innovation recommendations
    if scores.innovation < 50:
        recommendations.append("Allocate dedicated time for exploring new AI capabilities and tools")
        recommendations.append("Start an AI experimentation log to track and share learnings")
    elif scores.innovation < 70:
        recommendations.append("Participate in AI hackathons or innovation sprints to drive experimentation")
    
    # General high-level recommendations
    avg = (scores.adoption + scores.proficiency + scores.integration + 
           scores.governance + scores.innovation) / 5
    
    if avg >= 70:
        recommendations.append("Share team's AI success stories and best practices with other teams")
        recommendations.append("Mentor other teams in their AI adoption journey")
    
    return recommendations[:6]


def generate_insights(scores: MaturityScores) -> dict:
    """Generate insights based on scores"""
    strengths = []
    improvement_areas = []
    
    score_items = [
        ("Adoption", scores.adoption),
        ("Proficiency", scores.proficiency),
        ("Integration", scores.integration),
        ("Governance", scores.governance),
        ("Innovation", scores.innovation),
    ]
    
    for name, score in score_items:
        if score >= 70:
            if name == "Adoption":
                strengths.append("Strong AI tool adoption across team members")
            elif name == "Proficiency":
                strengths.append("High effectiveness in utilizing AI capabilities")
            elif name == "Integration":
                strengths.append("Well-integrated AI workflows in daily processes")
            elif name == "Governance":
                strengths.append("Strong adherence to AI governance and best practices")
            elif name == "Innovation":
                strengths.append("Active experimentation with new AI features")
        elif score < 50:
            if name == "Adoption":
                improvement_areas.append("Increase team-wide adoption of AI tools")
            elif name == "Proficiency":
                improvement_areas.append("Improve skill level in AI tool usage")
            elif name == "Integration":
                improvement_areas.append("Better integrate AI into existing workflows")
            elif name == "Governance":
                improvement_areas.append("Strengthen governance and compliance practices")
            elif name == "Innovation":
                improvement_areas.append("Encourage more experimentation with AI capabilities")
    
    return {"strengths": strengths, "improvement_areas": improvement_areas}


def db_to_maturity(db_m: TeamMaturityModel) -> TeamMaturity:
    """Convert database model to Pydantic model"""
    scores = MaturityScores(
        adoption=db_m.scores.get("adoption", 0) if db_m.scores else 0,
        proficiency=db_m.scores.get("proficiency", 0) if db_m.scores else 0,
        integration=db_m.scores.get("integration", 0) if db_m.scores else 0,
        governance=db_m.scores.get("governance", 0) if db_m.scores else 0,
        innovation=db_m.scores.get("innovation", 0) if db_m.scores else 0,
    )
    
    return TeamMaturity(
        id=db_m.id,
        team=db_m.team,
        department=db_m.department or "",
        assessment_date=db_m.assessment_date or datetime.utcnow(),
        scores=scores,
        overall_level=MaturityLevel(db_m.overall_level.value) if db_m.overall_level else MaturityLevel.novice,
        strengths=db_m.strengths or [],
        improvement_areas=db_m.improvement_areas or [],
        recommendations=db_m.recommendations or [],
        assessor=db_m.assessor or "AI Enablement Team",
    )


@router.get("/", response_model=List[TeamMaturity])
async def get_all_maturity_assessments(db: Session = Depends(get_db)):
    """Get all team maturity assessments"""
    repo = MaturityRepository(db)
    results = repo.get_all()
    return [db_to_maturity(m) for m in results]


@router.get("/summary")
async def get_maturity_summary(db: Session = Depends(get_db)):
    """Get organization-wide maturity summary"""
    repo = MaturityRepository(db)
    return repo.get_summary()


@router.get("/{maturity_id}", response_model=TeamMaturity)
async def get_maturity_assessment(maturity_id: str, db: Session = Depends(get_db)):
    """Get a specific team maturity assessment"""
    repo = MaturityRepository(db)
    result = repo.get(maturity_id)
    if not result:
        raise HTTPException(status_code=404, detail="Team maturity assessment not found")
    return db_to_maturity(result)


@router.post("/", response_model=TeamMaturity)
async def create_maturity_assessment(data: TeamMaturityCreate, db: Session = Depends(get_db)):
    """Create a new team maturity assessment"""
    repo = MaturityRepository(db)
    maturity_id = str(uuid.uuid4())
    
    overall_level = calculate_overall_level(data.scores)
    insights = generate_insights(data.scores)
    
    strengths = data.strengths if data.strengths else insights["strengths"]
    improvement_areas = data.improvement_areas if data.improvement_areas else insights["improvement_areas"]
    recommendations = data.recommendations if data.recommendations else generate_recommendations(
        data.scores, strengths, improvement_areas
    )
    
    db_level = DBMaturityLevel(overall_level.value)
    
    db_maturity = TeamMaturityModel(
        id=maturity_id,
        team=data.team,
        department=data.department,
        assessment_date=datetime.utcnow(),
        scores={
            "adoption": data.scores.adoption,
            "proficiency": data.scores.proficiency,
            "integration": data.scores.integration,
            "governance": data.scores.governance,
            "innovation": data.scores.innovation,
        },
        overall_level=db_level,
        strengths=strengths,
        improvement_areas=improvement_areas,
        recommendations=recommendations,
        assessor=data.assessor or "AI Enablement Team",
    )
    
    repo.create(db_maturity)
    return db_to_maturity(db_maturity)


@router.put("/{maturity_id}", response_model=TeamMaturity)
async def update_maturity_assessment(maturity_id: str, data: TeamMaturityUpdate, db: Session = Depends(get_db)):
    """Update an existing team maturity assessment"""
    repo = MaturityRepository(db)
    existing = repo.get(maturity_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Team maturity assessment not found")
    
    # Get existing scores
    existing_scores = MaturityScores(
        adoption=existing.scores.get("adoption", 0) if existing.scores else 0,
        proficiency=existing.scores.get("proficiency", 0) if existing.scores else 0,
        integration=existing.scores.get("integration", 0) if existing.scores else 0,
        governance=existing.scores.get("governance", 0) if existing.scores else 0,
        innovation=existing.scores.get("innovation", 0) if existing.scores else 0,
    )
    
    scores = data.scores if data.scores else existing_scores
    overall_level = calculate_overall_level(scores)
    
    insights = generate_insights(scores)
    strengths = data.strengths if data.strengths else (existing.strengths or insights["strengths"])
    improvement_areas = data.improvement_areas if data.improvement_areas else (existing.improvement_areas or insights["improvement_areas"])
    recommendations = data.recommendations if data.recommendations else generate_recommendations(
        scores, strengths, improvement_areas
    )
    
    db_level = DBMaturityLevel(overall_level.value)
    
    existing.team = data.team if data.team else existing.team
    existing.department = data.department if data.department else existing.department
    existing.assessment_date = datetime.utcnow()
    existing.scores = {
        "adoption": scores.adoption,
        "proficiency": scores.proficiency,
        "integration": scores.integration,
        "governance": scores.governance,
        "innovation": scores.innovation,
    }
    existing.overall_level = db_level
    existing.strengths = strengths
    existing.improvement_areas = improvement_areas
    existing.recommendations = recommendations
    existing.assessor = data.assessor if data.assessor else existing.assessor
    
    repo.update(existing)
    return db_to_maturity(existing)


@router.delete("/{maturity_id}")
async def delete_maturity_assessment(maturity_id: str, db: Session = Depends(get_db)):
    """Delete a team maturity assessment"""
    repo = MaturityRepository(db)
    if not repo.exists(maturity_id):
        raise HTTPException(status_code=404, detail="Team maturity assessment not found")
    
    repo.delete(maturity_id)
    return {"message": "Team maturity assessment deleted successfully"}


@router.get("/team/{team_name}", response_model=List[TeamMaturity])
async def get_maturity_by_team(team_name: str, db: Session = Depends(get_db)):
    """Get all maturity assessments for a specific team (history)"""
    repo = MaturityRepository(db)
    results = repo.get_by_team(team_name)
    return [db_to_maturity(m) for m in results]


@router.get("/department/{department}", response_model=List[TeamMaturity])
async def get_maturity_by_department(department: str, db: Session = Depends(get_db)):
    """Get all maturity assessments for a specific department"""
    repo = MaturityRepository(db)
    results = repo.get_by_department(department)
    return [db_to_maturity(m) for m in results]
