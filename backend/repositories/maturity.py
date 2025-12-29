"""
Team Maturity repository for database operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from db_models import TeamMaturityModel, MaturityLevel
from .base import BaseRepository


class MaturityRepository(BaseRepository[TeamMaturityModel]):
    """Repository for team maturity assessment operations."""
    
    def __init__(self, db: Session):
        super().__init__(TeamMaturityModel, db)
    
    def get_by_team(self, team: str) -> List[TeamMaturityModel]:
        """Get all assessments for a team (history)."""
        return self.db.query(self.model).filter(
            self.model.team.ilike(team)
        ).order_by(self.model.assessment_date.desc()).all()
    
    def get_by_department(self, department: str) -> List[TeamMaturityModel]:
        """Get all assessments for a department."""
        return self.db.query(self.model).filter(
            self.model.department.ilike(department)
        ).order_by(self.model.assessment_date.desc()).all()
    
    def get_latest_by_team(self, team: str) -> Optional[TeamMaturityModel]:
        """Get the latest assessment for a team."""
        return self.db.query(self.model).filter(
            self.model.team.ilike(team)
        ).order_by(self.model.assessment_date.desc()).first()
    
    def get_summary(self) -> dict:
        """Get organization-wide maturity summary."""
        teams = self.get_all()
        
        if not teams:
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
        
        total = len(teams)
        
        # Calculate averages from JSONB scores
        avg_scores = {
            "adoption": 0,
            "proficiency": 0,
            "integration": 0,
            "governance": 0,
            "innovation": 0,
        }
        
        for t in teams:
            scores = t.scores or {}
            for key in avg_scores:
                avg_scores[key] += scores.get(key, 0)
        
        for key in avg_scores:
            avg_scores[key] = round(avg_scores[key] / total)
        
        # Count levels
        level_dist = {"novice": 0, "developing": 0, "proficient": 0, "advanced": 0, "leading": 0}
        for t in teams:
            level = t.overall_level.value if t.overall_level else "novice"
            level_dist[level] = level_dist.get(level, 0) + 1
        
        advanced_teams = level_dist.get("advanced", 0) + level_dist.get("leading", 0)
        
        # Calculate average overall score
        avg_overall = round(sum(
            sum((t.scores or {}).values()) / 5 for t in teams
        ) / total)
        
        # Determine org overall level
        avg_total = sum(avg_scores.values()) / 5
        if avg_total >= 80:
            org_level = "leading"
        elif avg_total >= 65:
            org_level = "advanced"
        elif avg_total >= 50:
            org_level = "proficient"
        elif avg_total >= 35:
            org_level = "developing"
        else:
            org_level = "novice"
        
        return {
            "total_teams": total,
            "org_average_scores": avg_scores,
            "org_overall_level": org_level,
            "advanced_teams": advanced_teams,
            "avg_overall_score": avg_overall,
            "level_distribution": level_dist,
        }
