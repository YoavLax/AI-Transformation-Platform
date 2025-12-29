"""
Metrics repository for database operations.
"""
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from db_models import CopilotMetricsModel
from .base import BaseRepository


class MetricsRepository(BaseRepository[CopilotMetricsModel]):
    """Repository for Copilot metrics operations."""
    
    SINGLETON_ID = "copilot-metrics-singleton"
    
    def __init__(self, db: Session):
        super().__init__(CopilotMetricsModel, db)
    
    def get_current(self) -> Optional[CopilotMetricsModel]:
        """Get the current metrics record."""
        return self.get(self.SINGLETON_ID)
    
    def get_or_create(self) -> CopilotMetricsModel:
        """Get or create the metrics record."""
        metrics = self.get_current()
        if not metrics:
            metrics = CopilotMetricsModel(
                id=self.SINGLETON_ID,
                total_active_users=0,
                total_engaged_users=0,
                total_licenses=0,
                acceptance_rate=0,
                total_suggestions=0,
                total_acceptances=0,
                total_chats=0,
                teams=[],
                last_updated=datetime.utcnow()
            )
            self.db.add(metrics)
            self.db.commit()
            self.db.refresh(metrics)
        return metrics
    
    def update_metrics(
        self,
        total_active_users: int = 0,
        total_engaged_users: int = 0,
        total_licenses: int = 0,
        acceptance_rate: float = 0,
        total_suggestions: int = 0,
        total_acceptances: int = 0,
        total_chats: int = 0,
        teams: list = None
    ) -> CopilotMetricsModel:
        """Update or create metrics."""
        metrics = self.get_or_create()
        
        metrics.total_active_users = total_active_users
        metrics.total_engaged_users = total_engaged_users
        metrics.total_licenses = total_licenses
        metrics.acceptance_rate = acceptance_rate
        metrics.total_suggestions = total_suggestions
        metrics.total_acceptances = total_acceptances
        metrics.total_chats = total_chats
        metrics.teams = teams or []
        metrics.last_updated = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(metrics)
        return metrics
    
    def bulk_upsert(self, teams_data: List[dict]) -> int:
        """Bulk update teams data. Returns count of teams updated."""
        metrics = self.get_or_create()
        
        # Extract summary data from first team if available
        if teams_data and teams_data[0].get("summary_data"):
            summary = teams_data[0]["summary_data"]
            metrics.total_active_users = summary.get("total_active_users", 0)
            metrics.total_engaged_users = summary.get("total_engaged_users", 0)
            metrics.total_licenses = summary.get("total_licenses", 0)
            metrics.acceptance_rate = summary.get("acceptance_rate", 0)
            metrics.total_suggestions = summary.get("total_suggestions", 0)
            metrics.total_acceptances = summary.get("total_acceptances", 0)
            metrics.total_chats = summary.get("total_chats", 0)
        
        # Store teams as JSONB
        teams = []
        for t in teams_data:
            teams.append({
                "org": t.get("org", ""),
                "slug": t.get("slug", ""),
                "name": t.get("name", ""),
                "total_active_users": t.get("total_active_users", 0),
                "total_engaged_users": t.get("total_engaged_users", 0),
                "acceptance_rate": t.get("acceptance_rate", 0),
            })
        
        metrics.teams = teams
        metrics.last_updated = datetime.utcnow()
        
        self.db.commit()
        return len(teams)
    
    def get_summary(self) -> dict:
        """Get metrics summary for dashboard."""
        metrics = self.get_current()
        
        if not metrics:
            return {
                "acceptance_rate": 0,
                "total_active_users": 0,
                "total_engaged_users": 0,
                "total_licenses": 0,
                "teams_using_ai": 0,
                "total_teams": 0,
                "total_suggestions": 0,
                "total_acceptances": 0,
                "total_chats": 0,
                "last_updated": None
            }
        
        teams = metrics.teams or []
        teams_using_ai = len([t for t in teams if t.get("total_active_users", 0) > 0])
        total_teams = len(teams)
        
        return {
            "acceptance_rate": metrics.acceptance_rate,
            "total_active_users": metrics.total_active_users,
            "total_engaged_users": metrics.total_engaged_users,
            "total_licenses": metrics.total_licenses,
            "teams_using_ai": teams_using_ai,
            "total_teams": total_teams,
            "total_suggestions": metrics.total_suggestions,
            "total_acceptances": metrics.total_acceptances,
            "total_chats": metrics.total_chats,
            "last_updated": metrics.last_updated.isoformat() if metrics.last_updated else None
        }
