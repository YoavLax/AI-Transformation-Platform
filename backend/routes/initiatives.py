from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

# In-memory storage (replace with database in production)
initiatives_db = []


class ActionItem(BaseModel):
    id: str
    title: str
    completed: bool
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    created_at: str


class Risk(BaseModel):
    id: Optional[str] = None
    category: str
    description: str
    severity: str
    mitigation: Optional[str] = None
    owner: Optional[str] = None
    status: Optional[str] = "open"


class AIInitiative(BaseModel):
    id: str
    title: str
    description: str
    team: str
    sponsor: str
    status: str  # 'todo' | 'in-progress' | 'done'
    start_date: str
    target_date: str
    ai_assistants: List[str] = []
    objectives: List[str] = []
    action_items: List[ActionItem] = []
    risks: List[Risk] = []
    progress: int = 0
    created_at: str
    updated_at: str


class AIInitiativeCreate(BaseModel):
    title: str
    description: str
    team: str
    sponsor: str
    status: str = "todo"
    start_date: str
    target_date: str
    ai_assistants: List[str] = []
    objectives: List[str] = []
    action_items: List[ActionItem] = []
    risks: List[Risk] = []
    progress: int = 0


class AIInitiativeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    team: Optional[str] = None
    sponsor: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    target_date: Optional[str] = None
    ai_assistants: Optional[List[str]] = None
    objectives: Optional[List[str]] = None
    action_items: Optional[List[ActionItem]] = None
    risks: Optional[List[Risk]] = None
    progress: Optional[int] = None


@router.get("/", response_model=List[AIInitiative])
async def get_initiatives():
    """Get all AI initiatives"""
    return initiatives_db


@router.post("/", response_model=AIInitiative)
async def create_initiative(initiative: AIInitiativeCreate):
    """Create a new AI initiative"""
    from uuid import uuid4
    
    new_initiative = AIInitiative(
        id=str(uuid4()),
        **initiative.dict(),
        created_at=datetime.utcnow().isoformat(),
        updated_at=datetime.utcnow().isoformat()
    )
    initiatives_db.append(new_initiative)
    return new_initiative


@router.get("/{initiative_id}", response_model=AIInitiative)
async def get_initiative(initiative_id: str):
    """Get a specific AI initiative"""
    for initiative in initiatives_db:
        if initiative.id == initiative_id:
            return initiative
    raise HTTPException(status_code=404, detail="Initiative not found")


@router.put("/{initiative_id}", response_model=AIInitiative)
async def update_initiative(initiative_id: str, update: AIInitiativeUpdate):
    """Update an AI initiative"""
    for i, initiative in enumerate(initiatives_db):
        if initiative.id == initiative_id:
            update_data = update.dict(exclude_unset=True)
            updated_initiative = initiative.copy(update={
                **update_data,
                "updated_at": datetime.utcnow().isoformat()
            })
            initiatives_db[i] = updated_initiative
            return updated_initiative
    raise HTTPException(status_code=404, detail="Initiative not found")


@router.delete("/{initiative_id}")
async def delete_initiative(initiative_id: str):
    """Delete an AI initiative"""
    for i, initiative in enumerate(initiatives_db):
        if initiative.id == initiative_id:
            initiatives_db.pop(i)
            return {"message": "Initiative deleted successfully"}
    raise HTTPException(status_code=404, detail="Initiative not found")


@router.post("/{initiative_id}/action-items", response_model=AIInitiative)
async def add_action_item(initiative_id: str, action_item: ActionItem):
    """Add an action item to an initiative"""
    for i, initiative in enumerate(initiatives_db):
        if initiative.id == initiative_id:
            initiative.action_items.append(action_item)
            initiative.updated_at = datetime.utcnow().isoformat()
            initiatives_db[i] = initiative
            return initiative
    raise HTTPException(status_code=404, detail="Initiative not found")


@router.put("/{initiative_id}/action-items/{action_item_id}", response_model=AIInitiative)
async def update_action_item(initiative_id: str, action_item_id: str, completed: bool):
    """Update an action item's completion status"""
    for i, initiative in enumerate(initiatives_db):
        if initiative.id == initiative_id:
            for action_item in initiative.action_items:
                if action_item.id == action_item_id:
                    action_item.completed = completed
                    initiative.updated_at = datetime.utcnow().isoformat()
                    initiatives_db[i] = initiative
                    return initiative
            raise HTTPException(status_code=404, detail="Action item not found")
    raise HTTPException(status_code=404, detail="Initiative not found")


@router.delete("/{initiative_id}/action-items/{action_item_id}", response_model=AIInitiative)
async def delete_action_item(initiative_id: str, action_item_id: str):
    """Delete an action item from an initiative"""
    for i, initiative in enumerate(initiatives_db):
        if initiative.id == initiative_id:
            initiative.action_items = [
                item for item in initiative.action_items if item.id != action_item_id
            ]
            initiative.updated_at = datetime.utcnow().isoformat()
            initiatives_db[i] = initiative
            return initiative
    raise HTTPException(status_code=404, detail="Initiative not found")
