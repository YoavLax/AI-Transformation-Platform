from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
import uuid

from models import TeamMaturity, TeamMaturityCreate, TeamMaturityUpdate, MaturityScores, MaturityLevel

router = APIRouter()

# In-memory storage
maturity_db: dict[str, TeamMaturity] = {}


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
    
    return recommendations[:6]  # Return top 6 recommendations


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


@router.get("/", response_model=List[TeamMaturity])
async def get_all_maturity_assessments():
    """Get all team maturity assessments"""
    return list(maturity_db.values())


@router.get("/summary")
async def get_maturity_summary():
    """Get organization-wide maturity summary"""
    if not maturity_db:
        return {
            "total_teams": 0,
            "org_average_scores": {
                "adoption": 0,
                "proficiency": 0,
                "integration": 0,
                "governance": 0,
                "innovation": 0,
            },
            "org_overall_level": "novice",
            "advanced_teams": 0,
            "avg_overall_score": 0,
            "level_distribution": {
                "novice": 0,
                "developing": 0,
                "proficient": 0,
                "advanced": 0,
                "leading": 0,
            }
        }
    
    teams = list(maturity_db.values())
    total = len(teams)
    
    # Calculate averages
    avg_scores = MaturityScores(
        adoption=round(sum(t.scores.adoption for t in teams) / total),
        proficiency=round(sum(t.scores.proficiency for t in teams) / total),
        integration=round(sum(t.scores.integration for t in teams) / total),
        governance=round(sum(t.scores.governance for t in teams) / total),
        innovation=round(sum(t.scores.innovation for t in teams) / total),
    )
    
    # Count levels
    level_dist = {"novice": 0, "developing": 0, "proficient": 0, "advanced": 0, "leading": 0}
    for t in teams:
        level_dist[t.overall_level.value] += 1
    
    advanced_teams = level_dist["advanced"] + level_dist["leading"]
    
    avg_overall = round(sum(
        (t.scores.adoption + t.scores.proficiency + t.scores.integration + 
         t.scores.governance + t.scores.innovation) / 5
        for t in teams
    ) / total)
    
    return {
        "total_teams": total,
        "org_average_scores": avg_scores.model_dump(),
        "org_overall_level": calculate_overall_level(avg_scores).value,
        "advanced_teams": advanced_teams,
        "avg_overall_score": avg_overall,
        "level_distribution": level_dist,
    }


@router.get("/{maturity_id}", response_model=TeamMaturity)
async def get_maturity_assessment(maturity_id: str):
    """Get a specific team maturity assessment"""
    if maturity_id not in maturity_db:
        raise HTTPException(status_code=404, detail="Team maturity assessment not found")
    return maturity_db[maturity_id]


@router.post("/", response_model=TeamMaturity)
async def create_maturity_assessment(data: TeamMaturityCreate):
    """Create a new team maturity assessment"""
    maturity_id = str(uuid.uuid4())
    
    overall_level = calculate_overall_level(data.scores)
    insights = generate_insights(data.scores)
    
    # Use provided strengths/improvements or generate them
    strengths = data.strengths if data.strengths else insights["strengths"]
    improvement_areas = data.improvement_areas if data.improvement_areas else insights["improvement_areas"]
    
    # Use provided recommendations or generate them
    recommendations = data.recommendations if data.recommendations else generate_recommendations(
        data.scores, strengths, improvement_areas
    )
    
    assessment = TeamMaturity(
        id=maturity_id,
        team=data.team,
        department=data.department,
        assessment_date=datetime.utcnow(),
        scores=data.scores,
        overall_level=overall_level,
        strengths=strengths,
        improvement_areas=improvement_areas,
        recommendations=recommendations,
        assessor=data.assessor or "AI Enablement Team",
    )
    
    maturity_db[maturity_id] = assessment
    return assessment


@router.put("/{maturity_id}", response_model=TeamMaturity)
async def update_maturity_assessment(maturity_id: str, data: TeamMaturityUpdate):
    """Update an existing team maturity assessment"""
    if maturity_id not in maturity_db:
        raise HTTPException(status_code=404, detail="Team maturity assessment not found")
    
    existing = maturity_db[maturity_id]
    
    # Update scores if provided
    scores = data.scores if data.scores else existing.scores
    overall_level = calculate_overall_level(scores)
    
    insights = generate_insights(scores)
    strengths = data.strengths if data.strengths else (existing.strengths or insights["strengths"])
    improvement_areas = data.improvement_areas if data.improvement_areas else (existing.improvement_areas or insights["improvement_areas"])
    recommendations = data.recommendations if data.recommendations else generate_recommendations(
        scores, strengths, improvement_areas
    )
    
    updated = TeamMaturity(
        id=maturity_id,
        team=data.team if data.team else existing.team,
        department=data.department if data.department else existing.department,
        assessment_date=datetime.utcnow(),
        scores=scores,
        overall_level=overall_level,
        strengths=strengths,
        improvement_areas=improvement_areas,
        recommendations=recommendations,
        assessor=data.assessor if data.assessor else existing.assessor,
    )
    
    maturity_db[maturity_id] = updated
    return updated


@router.delete("/{maturity_id}")
async def delete_maturity_assessment(maturity_id: str):
    """Delete a team maturity assessment"""
    if maturity_id not in maturity_db:
        raise HTTPException(status_code=404, detail="Team maturity assessment not found")
    
    del maturity_db[maturity_id]
    return {"message": "Team maturity assessment deleted successfully"}


@router.get("/team/{team_name}", response_model=List[TeamMaturity])
async def get_maturity_by_team(team_name: str):
    """Get all maturity assessments for a specific team (history)"""
    return [m for m in maturity_db.values() if m.team.lower() == team_name.lower()]


@router.get("/department/{department}", response_model=List[TeamMaturity])
async def get_maturity_by_department(department: str):
    """Get all maturity assessments for a specific department"""
    return [m for m in maturity_db.values() if m.department.lower() == department.lower()]
