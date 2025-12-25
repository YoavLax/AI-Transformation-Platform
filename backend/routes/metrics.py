from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

# In-memory storage for metrics data
metrics_db: dict = {
    "summary": {
        "total_active_users": 0,
        "total_engaged_users": 0,
        "total_licenses": 0,
        "acceptance_rate": 0,
        "total_suggestions": 0,
        "total_acceptances": 0,
        "total_chats": 0,
    },
    "teams": [],
    "last_updated": None
}


class TeamMetrics(BaseModel):
    org: str
    slug: str
    name: str
    total_active_users: int = 0
    total_engaged_users: int = 0
    acceptance_rate: float = 0


class MetricsSummary(BaseModel):
    total_active_users: int = 0
    total_engaged_users: int = 0
    total_licenses: int = 0
    acceptance_rate: float = 0
    total_suggestions: int = 0
    total_acceptances: int = 0
    total_chats: int = 0


class MetricsSync(BaseModel):
    summary: MetricsSummary
    teams: List[TeamMetrics] = []


@router.get("/summary")
async def get_metrics_summary():
    """Get Copilot metrics summary - used by dashboard"""
    summary = metrics_db.get("summary", {})
    teams = metrics_db.get("teams", [])
    
    # Count unique teams with active users
    teams_using_ai = len([t for t in teams if t.get("total_active_users", 0) > 0])
    total_teams = len(teams) if teams else 0
    
    return {
        "acceptance_rate": summary.get("acceptance_rate", 0),
        "total_active_users": summary.get("total_active_users", 0),
        "total_engaged_users": summary.get("total_engaged_users", 0),
        "total_licenses": summary.get("total_licenses", 0),
        "teams_using_ai": teams_using_ai,
        "total_teams": total_teams,
        "total_suggestions": summary.get("total_suggestions", 0),
        "total_acceptances": summary.get("total_acceptances", 0),
        "total_chats": summary.get("total_chats", 0),
        "last_updated": metrics_db.get("last_updated")
    }


@router.get("/teams")
async def get_team_metrics():
    """Get metrics broken down by team"""
    return metrics_db.get("teams", [])


@router.post("/sync")
async def sync_metrics(data: MetricsSync):
    """Sync metrics from frontend Copilot API to backend"""
    global metrics_db
    
    metrics_db = {
        "summary": data.summary.model_dump(),
        "teams": [t.model_dump() for t in data.teams],
        "last_updated": datetime.utcnow().isoformat()
    }
    
    return {
        "message": "Metrics synced successfully",
        "teams_count": len(data.teams),
        "last_updated": metrics_db["last_updated"]
    }


@router.get("/")
async def get_all_metrics():
    """Get all stored metrics data"""
    return metrics_db
