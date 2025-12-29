"""
AI Initiative repository for database operations.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from db_models import AIInitiativeModel, ActionItemModel, InitiativeRiskModel
from .base import BaseRepository
import uuid


class InitiativeRepository(BaseRepository[AIInitiativeModel]):
    """Repository for AI initiative operations."""
    
    def __init__(self, db: Session):
        super().__init__(AIInitiativeModel, db)
    
    def get_with_relations(self, id: str) -> Optional[AIInitiativeModel]:
        """Get an initiative with action items and risks loaded."""
        return self.db.query(self.model).filter(self.model.id == id).first()
    
    def get_all_with_relations(self) -> List[AIInitiativeModel]:
        """Get all initiatives with relations loaded."""
        return self.db.query(self.model).all()
    
    def get_by_team(self, team: str) -> List[AIInitiativeModel]:
        """Get all initiatives for a team."""
        return self.db.query(self.model).filter(
            self.model.team.ilike(f"%{team}%")
        ).all()
    
    def get_by_status(self, status: str) -> List[AIInitiativeModel]:
        """Get all initiatives with a specific status."""
        return self.db.query(self.model).filter(
            self.model.status == status
        ).all()
    
    def add_action_item(
        self,
        initiative_id: str,
        title: str,
        assignee: Optional[str] = None,
        due_date: Optional[str] = None
    ) -> Optional[ActionItemModel]:
        """Add an action item to an initiative."""
        initiative = self.get(initiative_id)
        if not initiative:
            return None
        
        action_item = ActionItemModel(
            id=str(uuid.uuid4()),
            initiative_id=initiative_id,
            title=title,
            completed=False,
            assignee=assignee,
            due_date=due_date
        )
        self.db.add(action_item)
        self.db.commit()
        self.db.refresh(action_item)
        return action_item
    
    def update_action_item(
        self,
        initiative_id: str,
        action_item_id: str,
        completed: bool
    ) -> Optional[ActionItemModel]:
        """Update an action item's completion status."""
        action_item = self.db.query(ActionItemModel).filter(
            ActionItemModel.id == action_item_id,
            ActionItemModel.initiative_id == initiative_id
        ).first()
        
        if action_item:
            action_item.completed = completed
            self.db.commit()
            self.db.refresh(action_item)
        
        return action_item
    
    def delete_action_item(self, initiative_id: str, action_item_id: str) -> bool:
        """Delete an action item from an initiative."""
        action_item = self.db.query(ActionItemModel).filter(
            ActionItemModel.id == action_item_id,
            ActionItemModel.initiative_id == initiative_id
        ).first()
        
        if action_item:
            self.db.delete(action_item)
            self.db.commit()
            return True
        return False
    
    def add_risk(
        self,
        initiative_id: str,
        category: str,
        description: str,
        severity: str = "medium",
        mitigation: Optional[str] = None,
        owner: Optional[str] = None
    ) -> Optional[InitiativeRiskModel]:
        """Add a risk to an initiative."""
        initiative = self.get(initiative_id)
        if not initiative:
            return None
        
        risk = InitiativeRiskModel(
            id=str(uuid.uuid4()),
            initiative_id=initiative_id,
            category=category,
            description=description,
            severity=severity,
            mitigation=mitigation,
            owner=owner,
            status="open"
        )
        self.db.add(risk)
        self.db.commit()
        self.db.refresh(risk)
        return risk
