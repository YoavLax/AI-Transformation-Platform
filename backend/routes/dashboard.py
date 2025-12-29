from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from database import get_db
from repositories import (
    AssessmentRepository, UseCaseRepository, GovernanceRepository,
    ValueTrackingRepository, ROIRepository, AssistantRepository,
    MetricsRepository, LearningRepository
)
from routes.learning import LEARNING_PATHS

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Get aggregated dashboard summary with real data from all modules.
    This endpoint provides real-time statistics for the main dashboard.
    """
    # Initialize repositories
    assessment_repo = AssessmentRepository(db)
    use_case_repo = UseCaseRepository(db)
    governance_repo = GovernanceRepository(db)
    value_repo = ValueTrackingRepository(db)
    roi_repo = ROIRepository(db)
    assistant_repo = AssistantRepository(db)
    metrics_repo = MetricsRepository(db)
    learning_repo = LearningRepository(db)
    
    # ==========================================
    # AI Assistants data (Active Tools & Spend)
    # ==========================================
    assistant_summary = assistant_repo.get_summary()
    active_ai_tools = assistant_summary.get("active_ai_tools", 0)
    monthly_spend = assistant_summary.get("monthly_spend", 0)
    
    # ==========================================
    # Usage Metrics data (Copilot Rate & Teams)
    # ==========================================
    metrics_summary = metrics_repo.get_summary()
    
    # Copilot acceptance rate from metrics
    copilot_acceptance_rate = metrics_summary.get("acceptance_rate", 0)
    teams_using_ai = metrics_summary.get("teams_using_ai", 0)
    total_teams = metrics_summary.get("total_teams", 0)
    
    # If no metrics data, fall back to use case departments
    if total_teams == 0:
        use_cases = use_case_repo.get_all()
        teams_with_ai = set(uc.department for uc in use_cases if uc.department)
        teams_using_ai = len(teams_with_ai)
        total_teams = max(len(teams_with_ai), 1)
    
    # ==========================================
    # Maturity data from assessments
    # ==========================================
    assessments = assessment_repo.get_all()
    maturity_data = []
    avg_overall_score = 0
    maturity_level = 1
    maturity_label = "Initial"
    
    if assessments:
        # Get the latest assessment for maturity calculation
        latest_assessment = max(assessments, key=lambda a: a.date or datetime.min)
        scores = latest_assessment.scores or {}
        
        maturity_data = [
            {"subject": "Data Readiness", "value": scores.get("data_readiness", 0), "fullMark": 5},
            {"subject": "Technology", "value": scores.get("technology", 0), "fullMark": 5},
            {"subject": "Talent", "value": scores.get("talent", 0), "fullMark": 5},
            {"subject": "Governance", "value": scores.get("governance", 0), "fullMark": 5},
            {"subject": "Business Alignment", "value": scores.get("business_alignment", 0), "fullMark": 5},
        ]
        
        avg_overall_score = (
            scores.get("data_readiness", 0) + 
            scores.get("technology", 0) + 
            scores.get("talent", 0) + 
            scores.get("governance", 0) + 
            scores.get("business_alignment", 0)
        ) / 5
        
        # Determine maturity level (1-5) based on average score
        if avg_overall_score >= 4.5:
            maturity_level = 5
            maturity_label = "Optimizing"
        elif avg_overall_score >= 3.5:
            maturity_level = 4
            maturity_label = "Managed"
        elif avg_overall_score >= 2.5:
            maturity_level = 3
            maturity_label = "Defined"
        elif avg_overall_score >= 1.5:
            maturity_level = 2
            maturity_label = "Developing"
        else:
            maturity_level = 1
            maturity_label = "Initial"
    
    # ==========================================
    # Use case statistics
    # ==========================================
    use_cases = use_case_repo.get_all()
    use_cases_total = len(use_cases)
    use_cases_in_progress = len([uc for uc in use_cases if uc.status and uc.status.value == "in_progress"])
    use_cases_completed = len([uc for uc in use_cases if uc.status and uc.status.value == "completed"])
    use_cases_approved = len([uc for uc in use_cases if uc.status and uc.status.value == "approved"])
    
    # ==========================================
    # Governance stats
    # ==========================================
    model_cards = governance_repo.get_all()
    
    # Calculate risk summary
    high_risks = 0
    total_risks = 0
    for card in model_cards:
        for risk in card.risks:
            total_risks += 1
            if risk.severity and risk.severity.value in ["high", "critical"]:
                high_risks += 1
    
    # ==========================================
    # Value/ROI metrics
    # ==========================================
    value_records = value_repo.get_all()
    roi_calcs = roi_repo.get_all()
    
    total_investment = sum(r.investment or 0 for r in roi_calcs) if roi_calcs else 0
    total_returns = sum(r.returns or 0 for r in roi_calcs) if roi_calcs else 0
    total_roi = ((total_returns - total_investment) / total_investment * 100) if total_investment > 0 else 0
    
    # ==========================================
    # Learning progress
    # ==========================================
    paths = list(LEARNING_PATHS.values())
    progress_records = learning_repo.get_all_progress()
    
    # Count champions (users with 5+ completed modules)
    user_completions = {}
    for p in progress_records:
        user_completions[p.user_id] = user_completions.get(p.user_id, 0) + 1
    champions = len([u for u, count in user_completions.items() if count >= 5])
    
    # ==========================================
    # Build recent activity from all sources
    # ==========================================
    recent_activity = []
    
    # Add recent use cases
    for uc in sorted(use_cases, key=lambda x: x.created_at or datetime.min, reverse=True)[:3]:
        status_map = {
            "draft": "pending",
            "submitted": "pending", 
            "approved": "completed",
            "in_progress": "pending",
            "completed": "completed"
        }
        recent_activity.append({
            "type": "usecase",
            "title": f"Use case: {uc.title}",
            "time": _format_time_ago(uc.created_at) if uc.created_at else "recently",
            "status": status_map.get(uc.status.value if uc.status else "draft", "pending")
        })
    
    # Add recent assessments
    for assessment in sorted(assessments, key=lambda x: x.date or datetime.min, reverse=True)[:2]:
        recent_activity.append({
            "type": "assessment",
            "title": f"Assessment completed for {assessment.organization_name}",
            "time": _format_time_ago(assessment.date) if assessment.date else "recently",
            "status": "completed"
        })
    
    # Add recent model cards
    for card in sorted(model_cards, key=lambda x: x.updated_at or datetime.min, reverse=True)[:2]:
        recent_activity.append({
            "type": "governance",
            "title": f"Model card updated: {card.model_name}",
            "time": _format_time_ago(card.updated_at) if card.updated_at else "recently",
            "status": "completed"
        })
    
    # Add recent AI assistants
    assistants = assistant_repo.get_all()
    for assistant in sorted(assistants, key=lambda x: x.created_at or datetime.min, reverse=True)[:2]:
        recent_activity.append({
            "type": "assistant",
            "title": f"AI tool added: {assistant.name or 'Unknown'}",
            "time": _format_time_ago(assistant.created_at) if assistant.created_at else "recently",
            "status": "completed" if assistant.status and assistant.status.value == "active" else "pending"
        })
    
    # Sort all activity by recency and limit
    recent_activity = recent_activity[:5]
    
    return {
        "stats": {
            "active_ai_tools": active_ai_tools,
            "active_ai_tools_change": 0,
            "monthly_spend": monthly_spend,
            "monthly_spend_change": 0,
            "copilot_acceptance_rate": round(copilot_acceptance_rate, 1),
            "copilot_acceptance_rate_change": 0,
            "teams_using_ai": teams_using_ai,
            "total_teams": max(total_teams, teams_using_ai, 1),
            "teams_change": 0
        },
        "maturity": {
            "level": maturity_level,
            "label": maturity_label,
            "overall_score": round(avg_overall_score, 1),
            "radar_data": maturity_data,
            "champions": champions,
            "initiatives_in_progress": use_cases_in_progress + use_cases_approved
        },
        "use_cases": {
            "total": use_cases_total,
            "in_progress": use_cases_in_progress,
            "completed": use_cases_completed,
            "approved": use_cases_approved
        },
        "governance": {
            "model_cards": len(model_cards),
            "total_risks": total_risks,
            "high_risks": high_risks
        },
        "value": {
            "total_investment": total_investment,
            "total_returns": total_returns,
            "roi_percentage": round(total_roi, 1),
            "tracked_kpis": len(set(vr.kpi for vr in value_records if vr.kpi))
        },
        "recent_activity": recent_activity
    }


def _format_time_ago(dt: datetime) -> str:
    """Format a datetime as a human-readable time ago string."""
    if not dt:
        return "recently"
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 30:
        return f"{diff.days // 30} months ago"
    elif diff.days > 0:
        return f"{diff.days} days ago"
    elif diff.seconds > 3600:
        return f"{diff.seconds // 3600} hours ago"
    elif diff.seconds > 60:
        return f"{diff.seconds // 60} minutes ago"
    else:
        return "just now"


@router.get("/health")
async def dashboard_health(db: Session = Depends(get_db)):
    """Health check for dashboard data availability."""
    assessment_repo = AssessmentRepository(db)
    use_case_repo = UseCaseRepository(db)
    governance_repo = GovernanceRepository(db)
    value_repo = ValueTrackingRepository(db)
    
    assessments_count = len(assessment_repo.get_all())
    use_cases_count = len(use_case_repo.get_all())
    model_cards_count = len(governance_repo.get_all())
    value_records_count = len(value_repo.get_all())
    
    return {
        "assessments_count": assessments_count,
        "use_cases_count": use_cases_count,
        "model_cards_count": model_cards_count,
        "value_records_count": value_records_count,
        "has_data": any([
            assessments_count > 0,
            use_cases_count > 0,
            model_cards_count > 0,
            value_records_count > 0
        ])
    }
