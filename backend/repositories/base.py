"""
Base repository with common CRUD operations.
"""
from typing import TypeVar, Generic, Type, List, Optional
from sqlalchemy.orm import Session
from database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""
    
    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db
    
    def get(self, id: str) -> Optional[ModelType]:
        """Get a record by ID."""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_all(self) -> List[ModelType]:
        """Get all records."""
        return self.db.query(self.model).all()
    
    def create(self, obj: ModelType) -> ModelType:
        """Create a new record."""
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def update(self, obj: ModelType) -> ModelType:
        """Update an existing record."""
        self.db.commit()
        self.db.refresh(obj)
        return obj
    
    def delete(self, id: str) -> bool:
        """Delete a record by ID."""
        obj = self.get(id)
        if obj:
            self.db.delete(obj)
            self.db.commit()
            return True
        return False
    
    def exists(self, id: str) -> bool:
        """Check if a record exists."""
        return self.db.query(self.model).filter(self.model.id == id).count() > 0
