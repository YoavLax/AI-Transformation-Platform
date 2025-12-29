"""
Value Tracking repository for database operations.
"""
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from db_models import ValueRecordModel, ROICalculationModel
from .base import BaseRepository


class ValueTrackingRepository(BaseRepository[ValueRecordModel]):
    """Repository for value tracking operations."""
    
    def __init__(self, db: Session):
        super().__init__(ValueRecordModel, db)
    
    def get_filtered(
        self,
        usecase_id: Optional[str] = None,
        kpi: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[ValueRecordModel]:
        """Get value records with optional filters."""
        query = self.db.query(self.model)
        
        if usecase_id:
            query = query.filter(self.model.usecase_id == usecase_id)
        
        if kpi:
            query = query.filter(self.model.kpi.ilike(kpi))
        
        if start_date:
            query = query.filter(self.model.date >= start_date)
        
        if end_date:
            query = query.filter(self.model.date <= end_date)
        
        return query.order_by(self.model.date.desc()).all()
    
    def get_by_usecase(self, usecase_id: str) -> List[ValueRecordModel]:
        """Get all value records for a use case."""
        return self.db.query(self.model).filter(
            self.model.usecase_id == usecase_id
        ).order_by(self.model.date.desc()).all()
    
    def get_by_kpi(self, kpi: str) -> List[ValueRecordModel]:
        """Get all value records for a specific KPI."""
        return self.db.query(self.model).filter(
            self.model.kpi.ilike(kpi)
        ).order_by(self.model.date.desc()).all()


class ROIRepository(BaseRepository[ROICalculationModel]):
    """Repository for ROI calculation operations."""
    
    def __init__(self, db: Session):
        super().__init__(ROICalculationModel, db)
    
    def get_by_usecase(self, usecase_id: str) -> Optional[ROICalculationModel]:
        """Get ROI calculation for a use case."""
        return self.db.query(self.model).filter(
            self.model.usecase_id == usecase_id
        ).first()
    
    def upsert(self, roi: ROICalculationModel) -> ROICalculationModel:
        """Insert or update ROI calculation for a use case."""
        existing = self.get_by_usecase(roi.usecase_id)
        if existing:
            existing.investment = roi.investment
            existing.returns = roi.returns
            existing.roi_percentage = roi.roi_percentage
            existing.payback_months = roi.payback_months
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            return self.create(roi)
