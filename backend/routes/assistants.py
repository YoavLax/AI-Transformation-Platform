from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import uuid

router = APIRouter()

# In-memory storage (simulating the frontend localStorage)
assistants_db: dict[str, dict] = {}


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
async def get_assistants(status: Optional[str] = None, category: Optional[str] = None):
    """Get all AI assistants with optional filters"""
    results = list(assistants_db.values())
    
    if status:
        results = [a for a in results if a.get("status") == status]
    
    if category:
        results = [a for a in results if a.get("category") == category]
    
    return results


@router.get("/summary")
async def get_assistants_summary():
    """Get summary statistics for AI assistants - used by dashboard"""
    assistants = list(assistants_db.values())
    
    active_assistants = [a for a in assistants if a.get("status") == "active"]
    
    # Count active AI tools
    active_ai_tools = len(active_assistants)
    
    # Calculate total monthly spend
    monthly_spend = sum(
        a.get("monthly_price", 0) * a.get("licenses", 0) 
        for a in active_assistants
    )
    
    # Calculate total licenses and active users
    total_licenses = sum(a.get("licenses", 0) for a in active_assistants)
    total_active_users = sum(a.get("active_users", 0) for a in active_assistants)
    
    # Calculate utilization rate
    utilization_rate = (total_active_users / total_licenses * 100) if total_licenses > 0 else 0
    
    return {
        "active_ai_tools": active_ai_tools,
        "monthly_spend": monthly_spend,
        "total_licenses": total_licenses,
        "total_active_users": total_active_users,
        "utilization_rate": round(utilization_rate, 1),
        "by_category": _group_by_category(assistants),
        "by_status": _group_by_status(assistants)
    }


def _group_by_category(assistants: List[dict]) -> dict:
    """Group assistants by category"""
    result = {}
    for a in assistants:
        cat = a.get("category", "other")
        if cat not in result:
            result[cat] = {"count": 0, "spend": 0}
        result[cat]["count"] += 1
        if a.get("status") == "active":
            result[cat]["spend"] += a.get("monthly_price", 0) * a.get("licenses", 0)
    return result


def _group_by_status(assistants: List[dict]) -> dict:
    """Group assistants by status"""
    result = {}
    for a in assistants:
        status = a.get("status", "pending")
        result[status] = result.get(status, 0) + 1
    return result


@router.get("/{assistant_id}", response_model=AIAssistant)
async def get_assistant(assistant_id: str):
    """Get a specific AI assistant by ID"""
    if assistant_id not in assistants_db:
        raise HTTPException(status_code=404, detail="AI assistant not found")
    return assistants_db[assistant_id]


@router.post("/", response_model=AIAssistant)
async def create_assistant(data: AIAssistantCreate):
    """Create a new AI assistant"""
    assistant_id = str(uuid.uuid4())
    
    assistant = {
        "id": assistant_id,
        **data.model_dump(),
        "created_at": datetime.utcnow().isoformat()
    }
    
    assistants_db[assistant_id] = assistant
    return assistant


@router.put("/{assistant_id}", response_model=AIAssistant)
async def update_assistant(assistant_id: str, data: AIAssistantCreate):
    """Update an existing AI assistant"""
    if assistant_id not in assistants_db:
        raise HTTPException(status_code=404, detail="AI assistant not found")
    
    existing = assistants_db[assistant_id]
    
    updated = {
        "id": assistant_id,
        **data.model_dump(),
        "created_at": existing.get("created_at", datetime.utcnow().isoformat())
    }
    
    assistants_db[assistant_id] = updated
    return updated


@router.delete("/{assistant_id}")
async def delete_assistant(assistant_id: str):
    """Delete an AI assistant"""
    if assistant_id not in assistants_db:
        raise HTTPException(status_code=404, detail="AI assistant not found")
    
    del assistants_db[assistant_id]
    return {"message": "AI assistant deleted successfully"}


@router.post("/sync")
async def sync_assistants(assistants: List[AIAssistant]):
    """Sync assistants from frontend localStorage to backend"""
    global assistants_db
    assistants_db = {a.id: a.model_dump() for a in assistants}
    return {"message": f"Synced {len(assistants)} assistants", "count": len(assistants)}
