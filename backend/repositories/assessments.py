"""
Assessment repository for database operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from db_models import AssessmentModel
from .base import BaseRepository


class AssessmentRepository(BaseRepository[AssessmentModel]):
    """Repository for assessment operations."""
    
    def __init__(self, db: Session):
        super().__init__(AssessmentModel, db)
    
    def get_by_organization(self, org_name: str) -> List[AssessmentModel]:
        """Get all assessments for an organization."""
        return self.db.query(self.model).filter(
            self.model.organization_name.ilike(org_name)
        ).all()
    
    def get_latest_by_organization(self, org_name: str) -> Optional[AssessmentModel]:
        """Get the latest assessment for an organization."""
        return self.db.query(self.model).filter(
            self.model.organization_name.ilike(org_name)
        ).order_by(self.model.date.desc()).first()
