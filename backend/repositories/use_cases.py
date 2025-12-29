"""
Use Case repository for database operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from db_models import UseCaseModel, UseCaseStatus
from .base import BaseRepository


class UseCaseRepository(BaseRepository[UseCaseModel]):
    """Repository for use case operations."""
    
    def __init__(self, db: Session):
        super().__init__(UseCaseModel, db)
    
    def get_filtered(
        self,
        status: Optional[UseCaseStatus] = None,
        department: Optional[str] = None,
        min_impact: Optional[float] = None,
        min_feasibility: Optional[float] = None
    ) -> List[UseCaseModel]:
        """Get use cases with optional filters."""
        query = self.db.query(self.model)
        
        if status:
            query = query.filter(self.model.status == status)
        
        if department:
            query = query.filter(self.model.department.ilike(department))
        
        if min_impact is not None:
            query = query.filter(self.model.impact_score >= min_impact)
        
        if min_feasibility is not None:
            query = query.filter(self.model.feasibility_score >= min_feasibility)
        
        return query.all()
    
    def get_by_department(self, department: str) -> List[UseCaseModel]:
        """Get all use cases for a department."""
        return self.db.query(self.model).filter(
            self.model.department.ilike(department)
        ).all()
    
    def get_by_status(self, status: UseCaseStatus) -> List[UseCaseModel]:
        """Get all use cases with a specific status."""
        return self.db.query(self.model).filter(
            self.model.status == status
        ).all()
    
    def update_status(self, id: str, status: UseCaseStatus) -> Optional[UseCaseModel]:
        """Update the status of a use case."""
        use_case = self.get(id)
        if use_case:
            use_case.status = status
            self.db.commit()
            self.db.refresh(use_case)
        return use_case
