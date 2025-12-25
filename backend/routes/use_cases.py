from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import uuid

from models import UseCase, UseCaseCreate, UseCaseStatus, DataAvailability

router = APIRouter()

# In-memory storage
use_cases_db: dict[str, UseCase] = {}


@router.get("/", response_model=List[UseCase])
async def get_use_cases(
    status: Optional[UseCaseStatus] = None,
    department: Optional[str] = None,
    min_impact: Optional[float] = Query(None, ge=0, le=10),
    min_feasibility: Optional[float] = Query(None, ge=0, le=10)
):
    """Get all use cases with optional filters"""
    results = list(use_cases_db.values())
    
    if status:
        results = [uc for uc in results if uc.status == status]
    
    if department:
        results = [uc for uc in results 
                   if uc.department.lower() == department.lower()]
    
    if min_impact is not None:
        results = [uc for uc in results if uc.impact_score >= min_impact]
    
    if min_feasibility is not None:
        results = [uc for uc in results if uc.feasibility_score >= min_feasibility]
    
    return results


@router.get("/prioritized", response_model=List[UseCase])
async def get_prioritized_use_cases():
    """Get use cases sorted by priority (impact * feasibility / risk)"""
    cases = list(use_cases_db.values())
    
    def priority_score(uc: UseCase) -> float:
        risk_factor = max(uc.risk_score, 0.1)  # Avoid division by zero
        return (uc.impact_score * uc.feasibility_score) / risk_factor
    
    return sorted(cases, key=priority_score, reverse=True)


@router.get("/matrix")
async def get_matrix_data():
    """Get use cases formatted for 2x2 matrix visualization"""
    cases = list(use_cases_db.values())
    
    return [
        {
            "id": uc.id,
            "title": uc.title,
            "x": uc.feasibility_score,  # x-axis: feasibility
            "y": uc.impact_score,       # y-axis: impact
            "risk": uc.risk_score,
            "status": uc.status,
            "department": uc.department
        }
        for uc in cases
    ]


@router.get("/{usecase_id}", response_model=UseCase)
async def get_use_case(usecase_id: str):
    """Get a specific use case by ID"""
    if usecase_id not in use_cases_db:
        raise HTTPException(status_code=404, detail="Use case not found")
    return use_cases_db[usecase_id]


@router.post("/", response_model=UseCase)
async def create_use_case(data: UseCaseCreate):
    """Create a new use case"""
    usecase_id = str(uuid.uuid4())
    
    use_case = UseCase(
        id=usecase_id,
        title=data.title,
        description=data.description,
        department=data.department,
        problem_statement=data.problem_statement,
        expected_outcomes=data.expected_outcomes,
        data_availability=data.data_availability,
        impact_score=data.impact_score,
        feasibility_score=data.feasibility_score,
        risk_score=data.risk_score,
        timeline_estimate=data.timeline_estimate,
        status=UseCaseStatus.draft,
        created_at=datetime.utcnow()
    )
    
    use_cases_db[usecase_id] = use_case
    return use_case


@router.put("/{usecase_id}", response_model=UseCase)
async def update_use_case(usecase_id: str, data: UseCaseCreate):
    """Update an existing use case"""
    if usecase_id not in use_cases_db:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    existing = use_cases_db[usecase_id]
    
    updated = UseCase(
        id=usecase_id,
        title=data.title,
        description=data.description,
        department=data.department,
        problem_statement=data.problem_statement,
        expected_outcomes=data.expected_outcomes,
        data_availability=data.data_availability,
        impact_score=data.impact_score,
        feasibility_score=data.feasibility_score,
        risk_score=data.risk_score,
        timeline_estimate=data.timeline_estimate,
        status=existing.status,
        created_at=existing.created_at
    )
    
    use_cases_db[usecase_id] = updated
    return updated


@router.patch("/{usecase_id}/status")
async def update_use_case_status(usecase_id: str, status: UseCaseStatus):
    """Update the status of a use case"""
    if usecase_id not in use_cases_db:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    use_case = use_cases_db[usecase_id]
    use_case = UseCase(
        **{**use_case.model_dump(), "status": status}
    )
    use_cases_db[usecase_id] = use_case
    
    return {"message": f"Status updated to {status}", "use_case": use_case}


@router.delete("/{usecase_id}")
async def delete_use_case(usecase_id: str):
    """Delete a use case"""
    if usecase_id not in use_cases_db:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    del use_cases_db[usecase_id]
    return {"message": "Use case deleted successfully"}


@router.get("/stats/summary")
async def get_use_case_stats():
    """Get summary statistics for use cases"""
    cases = list(use_cases_db.values())
    
    if not cases:
        return {
            "total": 0,
            "by_status": {},
            "by_department": {},
            "avg_impact": 0,
            "avg_feasibility": 0,
            "avg_risk": 0
        }
    
    by_status = {}
    by_department = {}
    
    for uc in cases:
        status = uc.status.value
        by_status[status] = by_status.get(status, 0) + 1
        by_department[uc.department] = by_department.get(uc.department, 0) + 1
    
    return {
        "total": len(cases),
        "by_status": by_status,
        "by_department": by_department,
        "avg_impact": sum(uc.impact_score for uc in cases) / len(cases),
        "avg_feasibility": sum(uc.feasibility_score for uc in cases) / len(cases),
        "avg_risk": sum(uc.risk_score for uc in cases) / len(cases)
    }
