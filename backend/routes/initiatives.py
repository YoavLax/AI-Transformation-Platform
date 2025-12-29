from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from database import get_db
from db_models import AIInitiativeModel, ActionItemModel, InitiativeRiskModel, InitiativeStatus
from repositories import InitiativeRepository

router = APIRouter()


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
    status: str
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


def db_to_initiative(db_init: AIInitiativeModel) -> AIInitiative:
    """Convert database model to Pydantic model"""
    action_items = [
        ActionItem(
            id=ai.id,
            title=ai.title,
            completed=ai.completed,
            assignee=ai.assignee,
            due_date=ai.due_date,
            created_at=ai.created_at.isoformat() if ai.created_at else ""
        )
        for ai in db_init.action_items
    ]
    
    risks = [
        Risk(
            id=r.id,
            category=r.category,
            description=r.description,
            severity=r.severity,
            mitigation=r.mitigation,
            owner=r.owner,
            status=r.status
        )
        for r in db_init.risks
    ]
    
    return AIInitiative(
        id=db_init.id,
        title=db_init.title,
        description=db_init.description or "",
        team=db_init.team or "",
        sponsor=db_init.sponsor or "",
        status=db_init.status.value if db_init.status else "todo",
        start_date=db_init.start_date or "",
        target_date=db_init.target_date or "",
        ai_assistants=db_init.ai_assistants or [],
        objectives=db_init.objectives or [],
        action_items=action_items,
        risks=risks,
        progress=db_init.progress or 0,
        created_at=db_init.created_at.isoformat() if db_init.created_at else "",
        updated_at=db_init.updated_at.isoformat() if db_init.updated_at else ""
    )


@router.get("/", response_model=List[AIInitiative])
async def get_initiatives(db: Session = Depends(get_db)):
    """Get all AI initiatives"""
    repo = InitiativeRepository(db)
    results = repo.get_all()
    return [db_to_initiative(i) for i in results]


@router.post("/", response_model=AIInitiative)
async def create_initiative(initiative: AIInitiativeCreate, db: Session = Depends(get_db)):
    """Create a new AI initiative"""
    repo = InitiativeRepository(db)
    initiative_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    db_status = InitiativeStatus.todo
    try:
        db_status = InitiativeStatus(initiative.status)
    except ValueError:
        pass
    
    db_initiative = AIInitiativeModel(
        id=initiative_id,
        title=initiative.title,
        description=initiative.description,
        team=initiative.team,
        sponsor=initiative.sponsor,
        status=db_status,
        start_date=initiative.start_date,
        target_date=initiative.target_date,
        ai_assistants=initiative.ai_assistants,
        objectives=initiative.objectives,
        progress=initiative.progress,
        created_at=now,
        updated_at=now
    )
    
    repo.create(db_initiative)
    
    # Add action items
    for ai in initiative.action_items:
        action_item = ActionItemModel(
            id=ai.id or str(uuid.uuid4()),
            initiative_id=initiative_id,
            title=ai.title,
            completed=ai.completed,
            assignee=ai.assignee,
            due_date=ai.due_date,
            created_at=datetime.fromisoformat(ai.created_at) if ai.created_at else now
        )
        repo.add_action_item(initiative_id, action_item)
    
    # Add risks
    for r in initiative.risks:
        risk = InitiativeRiskModel(
            id=r.id or str(uuid.uuid4()),
            initiative_id=initiative_id,
            category=r.category,
            description=r.description,
            severity=r.severity,
            mitigation=r.mitigation,
            owner=r.owner,
            status=r.status or "open"
        )
        repo.add_risk(initiative_id, risk)
    
    # Re-fetch to get relationships
    result = repo.get(initiative_id)
    return db_to_initiative(result)


@router.get("/{initiative_id}", response_model=AIInitiative)
async def get_initiative(initiative_id: str, db: Session = Depends(get_db)):
    """Get a specific AI initiative"""
    repo = InitiativeRepository(db)
    result = repo.get(initiative_id)
    if not result:
        raise HTTPException(status_code=404, detail="Initiative not found")
    return db_to_initiative(result)


@router.put("/{initiative_id}", response_model=AIInitiative)
async def update_initiative(initiative_id: str, update: AIInitiativeUpdate, db: Session = Depends(get_db)):
    """Update an AI initiative"""
    repo = InitiativeRepository(db)
    existing = repo.get(initiative_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Initiative not found")
    
    update_data = update.model_dump(exclude_unset=True)
    
    if "title" in update_data:
        existing.title = update_data["title"]
    if "description" in update_data:
        existing.description = update_data["description"]
    if "team" in update_data:
        existing.team = update_data["team"]
    if "sponsor" in update_data:
        existing.sponsor = update_data["sponsor"]
    if "status" in update_data:
        try:
            existing.status = InitiativeStatus(update_data["status"])
        except ValueError:
            pass
    if "start_date" in update_data:
        existing.start_date = update_data["start_date"]
    if "target_date" in update_data:
        existing.target_date = update_data["target_date"]
    if "ai_assistants" in update_data:
        existing.ai_assistants = update_data["ai_assistants"]
    if "objectives" in update_data:
        existing.objectives = update_data["objectives"]
    if "progress" in update_data:
        existing.progress = update_data["progress"]
    
    existing.updated_at = datetime.utcnow()
    
    # Handle action items if provided
    if "action_items" in update_data and update_data["action_items"] is not None:
        # Clear existing and add new
        for ai in existing.action_items:
            db.delete(ai)
        db.flush()
        
        for ai_data in update_data["action_items"]:
            action_item = ActionItemModel(
                id=ai_data.id or str(uuid.uuid4()),
                initiative_id=initiative_id,
                title=ai_data.title,
                completed=ai_data.completed,
                assignee=ai_data.assignee,
                due_date=ai_data.due_date,
                created_at=datetime.fromisoformat(ai_data.created_at) if ai_data.created_at else datetime.utcnow()
            )
            db.add(action_item)
    
    # Handle risks if provided
    if "risks" in update_data and update_data["risks"] is not None:
        # Clear existing and add new
        for r in existing.risks:
            db.delete(r)
        db.flush()
        
        for r_data in update_data["risks"]:
            risk = InitiativeRiskModel(
                id=r_data.id or str(uuid.uuid4()),
                initiative_id=initiative_id,
                category=r_data.category,
                description=r_data.description,
                severity=r_data.severity,
                mitigation=r_data.mitigation,
                owner=r_data.owner,
                status=r_data.status or "open"
            )
            db.add(risk)
    
    repo.update(existing)
    
    # Re-fetch to get updated relationships
    result = repo.get(initiative_id)
    return db_to_initiative(result)


@router.delete("/{initiative_id}")
async def delete_initiative(initiative_id: str, db: Session = Depends(get_db)):
    """Delete an AI initiative"""
    repo = InitiativeRepository(db)
    if not repo.exists(initiative_id):
        raise HTTPException(status_code=404, detail="Initiative not found")
    
    repo.delete(initiative_id)
    return {"message": "Initiative deleted successfully"}


@router.post("/{initiative_id}/action-items", response_model=AIInitiative)
async def add_action_item(initiative_id: str, action_item: ActionItem, db: Session = Depends(get_db)):
    """Add an action item to an initiative"""
    repo = InitiativeRepository(db)
    existing = repo.get(initiative_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Initiative not found")
    
    db_action_item = ActionItemModel(
        id=action_item.id or str(uuid.uuid4()),
        initiative_id=initiative_id,
        title=action_item.title,
        completed=action_item.completed,
        assignee=action_item.assignee,
        due_date=action_item.due_date,
        created_at=datetime.fromisoformat(action_item.created_at) if action_item.created_at else datetime.utcnow()
    )
    
    repo.add_action_item(initiative_id, db_action_item)
    existing.updated_at = datetime.utcnow()
    repo.update(existing)
    
    result = repo.get(initiative_id)
    return db_to_initiative(result)


@router.put("/{initiative_id}/action-items/{action_item_id}", response_model=AIInitiative)
async def update_action_item(initiative_id: str, action_item_id: str, completed: bool, db: Session = Depends(get_db)):
    """Update an action item's completion status"""
    repo = InitiativeRepository(db)
    existing = repo.get(initiative_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Initiative not found")
    
    updated = repo.update_action_item(initiative_id, action_item_id, completed)
    if not updated:
        raise HTTPException(status_code=404, detail="Action item not found")
    
    existing.updated_at = datetime.utcnow()
    repo.update(existing)
    
    result = repo.get(initiative_id)
    return db_to_initiative(result)


@router.delete("/{initiative_id}/action-items/{action_item_id}", response_model=AIInitiative)
async def delete_action_item(initiative_id: str, action_item_id: str, db: Session = Depends(get_db)):
    """Delete an action item from an initiative"""
    repo = InitiativeRepository(db)
    existing = repo.get(initiative_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Initiative not found")
    
    repo.delete_action_item(initiative_id, action_item_id)
    existing.updated_at = datetime.utcnow()
    repo.update(existing)
    
    result = repo.get(initiative_id)
    return db_to_initiative(result)
