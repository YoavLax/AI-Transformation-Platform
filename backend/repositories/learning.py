"""
Learning Progress repository for database operations.
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
from db_models import LearningProgressModel
from .base import BaseRepository
import uuid


class LearningRepository(BaseRepository[LearningProgressModel]):
    """Repository for learning progress operations."""
    
    def __init__(self, db: Session):
        super().__init__(LearningProgressModel, db)
    
    def get_user_progress(self, user_id: str) -> List[LearningProgressModel]:
        """Get all learning progress records for a user."""
        return self.db.query(self.model).filter(
            self.model.user_id == user_id
        ).all()
    
    def get_all_progress(self) -> List[LearningProgressModel]:
        """Get all learning progress records."""
        return self.db.query(self.model).all()
    
    def complete_module(self, user_id: str, module_id: str, path_id: str) -> LearningProgressModel:
        """Mark a module as completed for a user."""
        # Check if already completed
        existing = self.db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.module_id == module_id
        ).first()
        
        if existing:
            return existing
        
        # Create new completion record
        progress = LearningProgressModel(
            id=str(uuid.uuid4()),
            user_id=user_id,
            module_id=module_id,
            path_id=path_id,
            completed_at=datetime.utcnow()
        )
        self.db.add(progress)
        self.db.commit()
        self.db.refresh(progress)
        
        return progress
    
    def uncomplete_module(self, user_id: str, module_id: str) -> bool:
        """Mark a module as not completed for a user."""
        result = self.db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.module_id == module_id
        ).delete()
        self.db.commit()
        return result > 0
    
    def is_module_completed(self, user_id: str, module_id: str) -> bool:
        """Check if a module is completed for a user."""
        return self.db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.module_id == module_id
        ).first() is not None
    
    def get_completed_modules(self, user_id: str) -> List[str]:
        """Get list of completed module IDs for a user."""
        progress_records = self.get_user_progress(user_id)
        return [p.module_id for p in progress_records]
    
    def get_path_progress(self, user_id: str, path_id: str) -> List[LearningProgressModel]:
        """Get progress for a specific learning path."""
        return self.db.query(self.model).filter(
            self.model.user_id == user_id,
            self.model.path_id == path_id
        ).all()
