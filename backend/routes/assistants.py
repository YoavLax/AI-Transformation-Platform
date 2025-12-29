from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from database import get_db
from db_models import AIAssistantModel, AssistantStatus as DBAssistantStatus
from repositories import AssistantRepository

router = APIRouter()


class AIAssistantCreate(BaseModel):
    name: str
    vendor: str
    description: str = ""
    category: str = "other"
    monthly_price: float = 0
    licenses: int = 0
    active_users: int = 0
    contract_start: str = ""
    contract_end: str = ""
    status: str = "pending"
    features: List[str] = []


class AIAssistant(AIAssistantCreate):
    id: str
    created_at: str


@router.get("/", response_model=List[AIAssistant])
async def get_assistants(
    status: Optional[str] = None, 
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all AI assistants with optional filters"""
    repo = AssistantRepository(db)
    results = repo.get_filtered(status, category)
    
    return [
        AIAssistant(
            id=a.id,
            name=a.name,
            vendor=a.vendor,
            description=a.description or "",
            category=a.category or "other",
            monthly_price=a.monthly_price or 0,
            licenses=a.licenses or 0,
            active_users=a.active_users or 0,
            contract_start=a.contract_start or "",
            contract_end=a.contract_end or "",
            status=a.status.value if a.status else "pending",
            features=a.features or [],
            created_at=a.created_at.isoformat() if a.created_at else ""
        )
        for a in results
    ]


@router.get("/summary")
async def get_assistants_summary(db: Session = Depends(get_db)):
    """Get summary statistics for AI assistants - used by dashboard"""
    repo = AssistantRepository(db)
    return repo.get_summary()


@router.get("/{assistant_id}", response_model=AIAssistant)
async def get_assistant(assistant_id: str, db: Session = Depends(get_db)):
    """Get a specific AI assistant by ID"""
    repo = AssistantRepository(db)
    a = repo.get(assistant_id)
    if not a:
        raise HTTPException(status_code=404, detail="AI assistant not found")
    
    return AIAssistant(
        id=a.id,
        name=a.name,
        vendor=a.vendor,
        description=a.description or "",
        category=a.category or "other",
        monthly_price=a.monthly_price or 0,
        licenses=a.licenses or 0,
        active_users=a.active_users or 0,
        contract_start=a.contract_start or "",
        contract_end=a.contract_end or "",
        status=a.status.value if a.status else "pending",
        features=a.features or [],
        created_at=a.created_at.isoformat() if a.created_at else ""
    )


@router.post("/", response_model=AIAssistant)
async def create_assistant(data: AIAssistantCreate, db: Session = Depends(get_db)):
    """Create a new AI assistant"""
    repo = AssistantRepository(db)
    assistant_id = str(uuid.uuid4())
    
    db_status = None
    try:
        db_status = DBAssistantStatus(data.status)
    except ValueError:
        db_status = DBAssistantStatus.pending
    
    db_assistant = AIAssistantModel(
        id=assistant_id,
        name=data.name,
        vendor=data.vendor,
        description=data.description,
        category=data.category,
        monthly_price=data.monthly_price,
        licenses=data.licenses,
        active_users=data.active_users,
        contract_start=data.contract_start,
        contract_end=data.contract_end,
        status=db_status,
        features=data.features,
        created_at=datetime.utcnow()
    )
    
    repo.create(db_assistant)
    
    return AIAssistant(
        id=db_assistant.id,
        name=db_assistant.name,
        vendor=db_assistant.vendor,
        description=db_assistant.description or "",
        category=db_assistant.category or "other",
        monthly_price=db_assistant.monthly_price or 0,
        licenses=db_assistant.licenses or 0,
        active_users=db_assistant.active_users or 0,
        contract_start=db_assistant.contract_start or "",
        contract_end=db_assistant.contract_end or "",
        status=db_assistant.status.value if db_assistant.status else "pending",
        features=db_assistant.features or [],
        created_at=db_assistant.created_at.isoformat() if db_assistant.created_at else ""
    )


@router.put("/{assistant_id}", response_model=AIAssistant)
async def update_assistant(assistant_id: str, data: AIAssistantCreate, db: Session = Depends(get_db)):
    """Update an existing AI assistant"""
    repo = AssistantRepository(db)
    existing = repo.get(assistant_id)
    if not existing:
        raise HTTPException(status_code=404, detail="AI assistant not found")
    
    db_status = None
    try:
        db_status = DBAssistantStatus(data.status)
    except ValueError:
        db_status = DBAssistantStatus.pending
    
    existing.name = data.name
    existing.vendor = data.vendor
    existing.description = data.description
    existing.category = data.category
    existing.monthly_price = data.monthly_price
    existing.licenses = data.licenses
    existing.active_users = data.active_users
    existing.contract_start = data.contract_start
    existing.contract_end = data.contract_end
    existing.status = db_status
    existing.features = data.features
    
    repo.update(existing)
    
    return AIAssistant(
        id=existing.id,
        name=existing.name,
        vendor=existing.vendor,
        description=existing.description or "",
        category=existing.category or "other",
        monthly_price=existing.monthly_price or 0,
        licenses=existing.licenses or 0,
        active_users=existing.active_users or 0,
        contract_start=existing.contract_start or "",
        contract_end=existing.contract_end or "",
        status=existing.status.value if existing.status else "pending",
        features=existing.features or [],
        created_at=existing.created_at.isoformat() if existing.created_at else ""
    )


@router.delete("/{assistant_id}")
async def delete_assistant(assistant_id: str, db: Session = Depends(get_db)):
    """Delete an AI assistant"""
    repo = AssistantRepository(db)
    if not repo.exists(assistant_id):
        raise HTTPException(status_code=404, detail="AI assistant not found")
    
    repo.delete(assistant_id)
    return {"message": "AI assistant deleted successfully"}


@router.post("/sync")
async def sync_assistants(assistants: List[AIAssistant], db: Session = Depends(get_db)):
    """Sync assistants from frontend localStorage to backend"""
    repo = AssistantRepository(db)
    
    assistants_data = []
    for a in assistants:
        db_status = None
        try:
            db_status = DBAssistantStatus(a.status)
        except ValueError:
            db_status = DBAssistantStatus.pending
            
        assistants_data.append({
            "id": a.id,
            "name": a.name,
            "vendor": a.vendor,
            "description": a.description,
            "category": a.category,
            "monthly_price": a.monthly_price,
            "licenses": a.licenses,
            "active_users": a.active_users,
            "contract_start": a.contract_start,
            "contract_end": a.contract_end,
            "status": db_status,
            "features": a.features,
            "created_at": datetime.fromisoformat(a.created_at) if a.created_at else datetime.utcnow()
        })
    
    count = repo.bulk_upsert(assistants_data)
    return {"message": f"Synced {count} assistants", "count": count}
