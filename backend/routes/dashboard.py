from fastapi import APIRouter
from typing import List, Optional
from datetime import datetime, timedelta

from routes.assessments import assessments_db
from routes.use_cases import use_cases_db
from routes.governance import model_cards_db
from routes.value_tracking import value_records_db, roi_calculations_db
from routes.learning import LEARNING_PATHS, user_progress
from routes.assistants import assistants_db
from routes.metrics import metrics_db

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary():
    """
    Get aggregated dashboard summary with real data from all modules.
    This endpoint provides real-time statistics for the main dashboard.
    """
    # ==========================================
    # AI Assistants data (Active Tools & Spend)
    # ==========================================
    assistants = list(assistants_db.values())
    active_assistants = [a for a in assistants if a.get("status") == "active"]
    
    # Count of active AI tools
    active_ai_tools = len(active_assistants)
    
    # Monthly spend from AI assistants (price * licenses)
    monthly_spend = sum(
        a.get("monthly_price", 0) * a.get("licenses", 0) 
        for a in active_assistants
    )
    
    # ==========================================
    # Usage Metrics data (Copilot Rate & Teams)
    # ==========================================
    metrics_summary = metrics_db.get("summary", {})
    metrics_teams = metrics_db.get("teams", [])
    
    # Copilot acceptance rate from metrics
    copilot_acceptance_rate = metrics_summary.get("acceptance_rate", 0)
    
    # Teams using AI from metrics (teams with active users)
    teams_using_ai = len([t for t in metrics_teams if t.get("total_active_users", 0) > 0])
    total_teams = len(metrics_teams) if metrics_teams else 0
    
    # If no metrics data, fall back to use case departments
    if total_teams == 0:
        use_cases = list(use_cases_db.values())
        teams_with_ai = set(uc.department for uc in use_cases)
        teams_using_ai = len(teams_with_ai)
        total_teams = max(len(teams_with_ai), 1)
    
    # ==========================================
    # Maturity data from assessments
    # ==========================================
    assessments = list(assessments_db.values())
    maturity_data = []
    avg_overall_score = 0
    maturity_level = 1
    maturity_label = "Initial"
    
    if assessments:
        # Get the latest assessment for maturity calculation
        latest_assessment = max(assessments, key=lambda a: a.date)
        scores = latest_assessment.scores
        
        maturity_data = [
            {"subject": "Data Readiness", "value": scores.data_readiness, "fullMark": 5},
            {"subject": "Technology", "value": scores.technology, "fullMark": 5},
            {"subject": "Talent", "value": scores.talent, "fullMark": 5},
            {"subject": "Governance", "value": scores.governance, "fullMark": 5},
            {"subject": "Business Alignment", "value": scores.business_alignment, "fullMark": 5},
        ]
        
        avg_overall_score = (
            scores.data_readiness + 
            scores.technology + 
            scores.talent + 
            scores.governance + 
            scores.business_alignment
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
    use_cases = list(use_cases_db.values())
    use_cases_total = len(use_cases)
    use_cases_in_progress = len([uc for uc in use_cases if uc.status.value == "in_progress"])
    use_cases_completed = len([uc for uc in use_cases if uc.status.value == "completed"])
    use_cases_approved = len([uc for uc in use_cases if uc.status.value == "approved"])
    
    # ==========================================
    # Governance stats
    # ==========================================
    model_cards = list(model_cards_db.values())
    
    # Calculate risk summary
    high_risks = 0
    total_risks = 0
    for card in model_cards:
        for risk in card.risks:
            total_risks += 1
            if risk.severity.value in ["high", "critical"]:
                high_risks += 1
    
    # ==========================================
    # Value/ROI metrics
    # ==========================================
    value_records = list(value_records_db.values())
    roi_calcs = list(roi_calculations_db.values())
    
    total_investment = sum(r.investment for r in roi_calcs) if roi_calcs else 0
    total_returns = sum(r.returns for r in roi_calcs) if roi_calcs else 0
    total_roi = ((total_returns - total_investment) / total_investment * 100) if total_investment > 0 else 0
    
    # ==========================================
    # Learning progress
    # ==========================================
    paths = list(LEARNING_PATHS.values())
    progress_records = list(user_progress.values())
    
    champions = len([p for p in progress_records if len(p.get("completed_modules", [])) >= 5]) if progress_records else 0
    
    # ==========================================
    # Build recent activity from all sources
    # ==========================================
    recent_activity = []
    
    # Add recent use cases
    for uc in sorted(use_cases, key=lambda x: x.created_at, reverse=True)[:3]:
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
            "time": _format_time_ago(uc.created_at),
            "status": status_map.get(uc.status.value, "pending")
        })
    
    # Add recent assessments
    for assessment in sorted(assessments, key=lambda x: x.date, reverse=True)[:2]:
        recent_activity.append({
            "type": "assessment",
            "title": f"Assessment completed for {assessment.organization_name}",
            "time": _format_time_ago(assessment.date),
            "status": "completed"
        })
    
    # Add recent model cards
    for card in sorted(model_cards, key=lambda x: x.updated_at, reverse=True)[:2]:
        recent_activity.append({
            "type": "governance",
            "title": f"Model card updated: {card.model_name}",
            "time": _format_time_ago(card.updated_at),
            "status": "completed"
        })
    
    # Add recent AI assistants
    for assistant in sorted(assistants, key=lambda x: x.get("created_at", ""), reverse=True)[:2]:
        recent_activity.append({
            "type": "assistant",
            "title": f"AI tool added: {assistant.get('name', 'Unknown')}",
            "time": _format_time_ago(datetime.fromisoformat(assistant.get("created_at", datetime.utcnow().isoformat()).replace("Z", ""))),
            "status": "completed" if assistant.get("status") == "active" else "pending"
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
            "tracked_kpis": len(set(vr.kpi for vr in value_records))
        },
        "recent_activity": recent_activity
    }


def _format_time_ago(dt: datetime) -> str:
    """Format a datetime as a human-readable time ago string."""
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
async def dashboard_health():
    """Health check for dashboard data availability."""
    return {
        "assessments_count": len(assessments_db),
        "use_cases_count": len(use_cases_db),
        "model_cards_count": len(model_cards_db),
        "value_records_count": len(value_records_db),
        "has_data": any([
            len(assessments_db) > 0,
            len(use_cases_db) > 0,
            len(model_cards_db) > 0,
            len(value_records_db) > 0
        ])
    }
