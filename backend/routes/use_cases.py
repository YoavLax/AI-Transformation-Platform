from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import uuid

from database import get_db
from db_models import UseCaseModel, UseCaseStatus as DBUseCaseStatus
from repositories import UseCaseRepository
from models import UseCase, UseCaseCreate, UseCaseStatus, DataAvailability

router = APIRouter()


@router.get("/", response_model=List[UseCase])
async def get_use_cases(
    status: Optional[UseCaseStatus] = None,
    department: Optional[str] = None,
    min_impact: Optional[float] = Query(None, ge=0, le=10),
    min_feasibility: Optional[float] = Query(None, ge=0, le=10),
    db: Session = Depends(get_db)
):
    """Get all use cases with optional filters"""
    repo = UseCaseRepository(db)
    db_status = DBUseCaseStatus(status.value) if status else None
    results = repo.get_filtered(db_status, department, min_impact, min_feasibility)
    
    return [
        UseCase(
            id=uc.id,
            title=uc.title,
            description=uc.description,
            department=uc.department,
            problem_statement=uc.problem_statement,
            expected_outcomes=uc.expected_outcomes,
            data_availability=DataAvailability(uc.data_availability.value),
            impact_score=uc.impact_score,
            feasibility_score=uc.feasibility_score,
            risk_score=uc.risk_score,
            timeline_estimate=uc.timeline_estimate,
            status=UseCaseStatus(uc.status.value),
            created_at=uc.created_at
        )
        for uc in results
    ]


@router.get("/prioritized", response_model=List[UseCase])
async def get_prioritized_use_cases(db: Session = Depends(get_db)):
    """Get use cases sorted by priority (impact * feasibility / risk)"""
    repo = UseCaseRepository(db)
    cases = repo.get_all()
    
    def priority_score(uc: UseCaseModel) -> float:
        risk_factor = max(uc.risk_score, 0.1)  # Avoid division by zero
        return (uc.impact_score * uc.feasibility_score) / risk_factor
    
    sorted_cases = sorted(cases, key=priority_score, reverse=True)
    
    return [
        UseCase(
            id=uc.id,
            title=uc.title,
            description=uc.description,
            department=uc.department,
            problem_statement=uc.problem_statement,
            expected_outcomes=uc.expected_outcomes,
            data_availability=DataAvailability(uc.data_availability.value),
            impact_score=uc.impact_score,
            feasibility_score=uc.feasibility_score,
            risk_score=uc.risk_score,
            timeline_estimate=uc.timeline_estimate,
            status=UseCaseStatus(uc.status.value),
            created_at=uc.created_at
        )
        for uc in sorted_cases
    ]


@router.get("/matrix")
async def get_matrix_data(db: Session = Depends(get_db)):
    """Get use cases formatted for 2x2 matrix visualization"""
    repo = UseCaseRepository(db)
    cases = repo.get_all()
    
    return [
        {
            "id": uc.id,
            "title": uc.title,
            "x": uc.feasibility_score,  # x-axis: feasibility
            "y": uc.impact_score,       # y-axis: impact
            "risk": uc.risk_score,
            "status": uc.status.value,
            "department": uc.department
        }
        for uc in cases
    ]


@router.get("/{usecase_id}", response_model=UseCase)
async def get_use_case(usecase_id: str, db: Session = Depends(get_db)):
    """Get a specific use case by ID"""
    repo = UseCaseRepository(db)
    uc = repo.get(usecase_id)
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")
    return UseCase(
        id=uc.id,
        title=uc.title,
        description=uc.description,
        department=uc.department,
        problem_statement=uc.problem_statement,
        expected_outcomes=uc.expected_outcomes,
        data_availability=DataAvailability(uc.data_availability.value),
        impact_score=uc.impact_score,
        feasibility_score=uc.feasibility_score,
        risk_score=uc.risk_score,
        timeline_estimate=uc.timeline_estimate,
        status=UseCaseStatus(uc.status.value),
        created_at=uc.created_at
    )


@router.post("/", response_model=UseCase)
async def create_use_case(data: UseCaseCreate, db: Session = Depends(get_db)):
    """Create a new use case"""
    repo = UseCaseRepository(db)
    usecase_id = str(uuid.uuid4())
    
    db_use_case = UseCaseModel(
        id=usecase_id,
        title=data.title,
        description=data.description,
        department=data.department,
        problem_statement=data.problem_statement,
        expected_outcomes=data.expected_outcomes,
        data_availability=DBUseCaseStatus(data.data_availability.value) if hasattr(data.data_availability, 'value') else data.data_availability,
        impact_score=data.impact_score,
        feasibility_score=data.feasibility_score,
        risk_score=data.risk_score,
        timeline_estimate=data.timeline_estimate,
        status=DBUseCaseStatus.draft,
        created_at=datetime.utcnow()
    )
    
    repo.create(db_use_case)
    
    return UseCase(
        id=db_use_case.id,
        title=db_use_case.title,
        description=db_use_case.description,
        department=db_use_case.department,
        problem_statement=db_use_case.problem_statement,
        expected_outcomes=db_use_case.expected_outcomes,
        data_availability=data.data_availability,
        impact_score=db_use_case.impact_score,
        feasibility_score=db_use_case.feasibility_score,
        risk_score=db_use_case.risk_score,
        timeline_estimate=db_use_case.timeline_estimate,
        status=UseCaseStatus.draft,
        created_at=db_use_case.created_at
    )


@router.put("/{usecase_id}", response_model=UseCase)
async def update_use_case(usecase_id: str, data: UseCaseCreate, db: Session = Depends(get_db)):
    """Update an existing use case"""
    repo = UseCaseRepository(db)
    existing = repo.get(usecase_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    existing.title = data.title
    existing.description = data.description
    existing.department = data.department
    existing.problem_statement = data.problem_statement
    existing.expected_outcomes = data.expected_outcomes
    existing.data_availability = data.data_availability
    existing.impact_score = data.impact_score
    existing.feasibility_score = data.feasibility_score
    existing.risk_score = data.risk_score
    existing.timeline_estimate = data.timeline_estimate
    
    repo.update(existing)
    
    return UseCase(
        id=existing.id,
        title=existing.title,
        description=existing.description,
        department=existing.department,
        problem_statement=existing.problem_statement,
        expected_outcomes=existing.expected_outcomes,
        data_availability=DataAvailability(existing.data_availability.value),
        impact_score=existing.impact_score,
        feasibility_score=existing.feasibility_score,
        risk_score=existing.risk_score,
        timeline_estimate=existing.timeline_estimate,
        status=UseCaseStatus(existing.status.value),
        created_at=existing.created_at
    )


@router.patch("/{usecase_id}/status")
async def update_use_case_status(usecase_id: str, status: UseCaseStatus, db: Session = Depends(get_db)):
    """Update the status of a use case"""
    repo = UseCaseRepository(db)
    db_status = DBUseCaseStatus(status.value)
    uc = repo.update_status(usecase_id, db_status)
    if not uc:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    return {"message": f"Status updated to {status.value}", "use_case_id": uc.id}


@router.delete("/{usecase_id}")
async def delete_use_case(usecase_id: str, db: Session = Depends(get_db)):
    """Delete a use case"""
    repo = UseCaseRepository(db)
    if not repo.exists(usecase_id):
        raise HTTPException(status_code=404, detail="Use case not found")
    
    repo.delete(usecase_id)
    return {"message": "Use case deleted successfully"}


@router.get("/stats/summary")
async def get_use_case_stats(db: Session = Depends(get_db)):
    """Get summary statistics for use cases"""
    repo = UseCaseRepository(db)
    cases = repo.get_all()
    
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
