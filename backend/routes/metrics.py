from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from db_models import CopilotMetricsModel
from repositories import MetricsRepository

router = APIRouter()


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
async def get_metrics_summary(db: Session = Depends(get_db)):
    """Get Copilot metrics summary - used by dashboard"""
    repo = MetricsRepository(db)
    return repo.get_summary()


@router.get("/teams")
async def get_team_metrics(db: Session = Depends(get_db)):
    """Get metrics broken down by team"""
    repo = MetricsRepository(db)
    metrics = repo.get_current()
    if not metrics or not metrics.teams:
        return []
    return metrics.teams


@router.post("/sync")
async def sync_metrics(data: MetricsSync, db: Session = Depends(get_db)):
    """Sync metrics from frontend Copilot API to backend"""
    repo = MetricsRepository(db)
    
    # Build teams data for bulk upsert
    teams_data = [
        {
            "id": f"{t.org}-{t.slug}",
            "org": t.org,
            "slug": t.slug,
            "name": t.name,
            "total_active_users": t.total_active_users,
            "total_engaged_users": t.total_engaged_users,
            "acceptance_rate": t.acceptance_rate,
            "summary_data": data.summary.model_dump(),
            "last_updated": datetime.utcnow()
        }
        for t in data.teams
    ]
    
    count = repo.bulk_upsert(teams_data)
    
    return {
        "message": "Metrics synced successfully",
        "teams_count": count,
        "last_updated": datetime.utcnow().isoformat()
    }


@router.get("/")
async def get_all_metrics(db: Session = Depends(get_db)):
    """Get all stored metrics data"""
    repo = MetricsRepository(db)
    metrics = repo.get_current()
    
    if not metrics:
        return {
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
    
    return {
        "summary": {
            "total_active_users": metrics.total_active_users or 0,
            "total_engaged_users": metrics.total_engaged_users or 0,
            "total_licenses": metrics.total_licenses or 0,
            "acceptance_rate": metrics.acceptance_rate or 0,
            "total_suggestions": metrics.total_suggestions or 0,
            "total_acceptances": metrics.total_acceptances or 0,
            "total_chats": metrics.total_chats or 0,
        },
        "teams": metrics.teams or [],
        "last_updated": metrics.last_updated.isoformat() if metrics.last_updated else None
    }
