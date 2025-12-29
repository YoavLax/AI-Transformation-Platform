from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import uuid

from database import get_db
from db_models import ValueRecordModel, ROICalculationModel
from repositories.value_tracking import ValueTrackingRepository, ROIRepository
from models import ValueRecord, ValueRecordCreate, ROICalculation

router = APIRouter()


@router.get("/", response_model=List[ValueRecord])
async def get_value_records(
    usecase_id: Optional[str] = None,
    kpi: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Get all value records with optional filters"""
    repo = ValueTrackingRepository(db)
    results = repo.get_filtered(usecase_id, kpi, start_date, end_date)
    
    return [
        ValueRecord(
            id=r.id,
            usecase_id=r.usecase_id,
            usecase_title=r.usecase_title,
            kpi=r.kpi,
            value=r.value,
            target=r.target,
            unit=r.unit,
            date=r.date
        )
        for r in results
    ]


@router.get("/trends")
async def get_value_trends(
    usecase_id: Optional[str] = None,
    period: str = Query("month", regex="^(week|month|quarter|year)$"),
    db: Session = Depends(get_db)
):
    """Get value trends over time"""
    repo = ValueTrackingRepository(db)
    records = repo.get_filtered(usecase_id=usecase_id) if usecase_id else repo.get_all()
    
    # Group by KPI and date
    trends = {}
    for record in records:
        if record.kpi not in trends:
            trends[record.kpi] = []
        trends[record.kpi].append({
            "date": record.date.isoformat() if record.date else None,
            "value": record.value,
            "target": record.target,
            "achievement": (record.value / record.target * 100) if record.target > 0 else 0
        })
    
    return trends


@router.get("/dashboard")
async def get_value_dashboard(db: Session = Depends(get_db)):
    """Get dashboard summary of value tracking"""
    repo = ValueTrackingRepository(db)
    roi_repo = ROIRepository(db)
    
    records = repo.get_all()
    roi_calcs = roi_repo.get_all()
    
    if not records:
        return {
            "total_records": 0,
            "kpis_tracked": 0,
            "usecases_tracked": 0,
            "avg_achievement": 0,
            "total_roi": 0,
            "top_performers": [],
            "needs_attention": []
        }
    
    # Calculate metrics
    kpis = set(r.kpi for r in records)
    usecases = set(r.usecase_id for r in records)
    
    achievements = []
    for r in records:
        if r.target > 0:
            achievements.append(r.value / r.target * 100)
    
    avg_achievement = sum(achievements) / len(achievements) if achievements else 0
    
    # Calculate total ROI
    total_investment = sum(r.investment for r in roi_calcs)
    total_returns = sum(r.returns for r in roi_calcs)
    total_roi = ((total_returns - total_investment) / total_investment * 100) if total_investment > 0 else 0
    
    # Find top performers and needs attention
    by_usecase = {}
    for r in records:
        if r.usecase_id not in by_usecase:
            by_usecase[r.usecase_id] = {
                "usecase_id": r.usecase_id,
                "usecase_title": r.usecase_title,
                "achievements": []
            }
        if r.target > 0:
            by_usecase[r.usecase_id]["achievements"].append(r.value / r.target * 100)
    
    usecase_scores = []
    for uc_id, data in by_usecase.items():
        if data["achievements"]:
            avg = sum(data["achievements"]) / len(data["achievements"])
            usecase_scores.append({
                "usecase_id": uc_id,
                "usecase_title": data["usecase_title"],
                "avg_achievement": avg
            })
    
    usecase_scores.sort(key=lambda x: x["avg_achievement"], reverse=True)
    
    return {
        "total_records": len(records),
        "kpis_tracked": len(kpis),
        "usecases_tracked": len(usecases),
        "avg_achievement": avg_achievement,
        "total_roi": total_roi,
        "top_performers": usecase_scores[:3],
        "needs_attention": [u for u in usecase_scores if u["avg_achievement"] < 80][:3]
    }


@router.get("/{record_id}", response_model=ValueRecord)
async def get_value_record(record_id: str, db: Session = Depends(get_db)):
    """Get a specific value record by ID"""
    repo = ValueTrackingRepository(db)
    r = repo.get(record_id)
    if not r:
        raise HTTPException(status_code=404, detail="Value record not found")
    return ValueRecord(
        id=r.id,
        usecase_id=r.usecase_id,
        usecase_title=r.usecase_title,
        kpi=r.kpi,
        value=r.value,
        target=r.target,
        unit=r.unit,
        date=r.date
    )


@router.post("/", response_model=ValueRecord)
async def create_value_record(data: ValueRecordCreate, db: Session = Depends(get_db)):
    """Create a new value record"""
    repo = ValueTrackingRepository(db)
    record_id = str(uuid.uuid4())
    
    db_record = ValueRecordModel(
        id=record_id,
        usecase_id=data.usecase_id,
        usecase_title=data.usecase_title,
        kpi=data.kpi,
        value=data.value,
        target=data.target,
        unit=data.unit,
        date=datetime.utcnow()
    )
    
    repo.create(db_record)
    
    return ValueRecord(
        id=db_record.id,
        usecase_id=db_record.usecase_id,
        usecase_title=db_record.usecase_title,
        kpi=db_record.kpi,
        value=db_record.value,
        target=db_record.target,
        unit=db_record.unit,
        date=db_record.date
    )


@router.put("/{record_id}", response_model=ValueRecord)
async def update_value_record(record_id: str, data: ValueRecordCreate, db: Session = Depends(get_db)):
    """Update an existing value record"""
    repo = ValueTrackingRepository(db)
    existing = repo.get(record_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Value record not found")
    
    existing.usecase_id = data.usecase_id
    existing.usecase_title = data.usecase_title
    existing.kpi = data.kpi
    existing.value = data.value
    existing.target = data.target
    existing.unit = data.unit
    
    repo.update(existing)
    
    return ValueRecord(
        id=existing.id,
        usecase_id=existing.usecase_id,
        usecase_title=existing.usecase_title,
        kpi=existing.kpi,
        value=existing.value,
        target=existing.target,
        unit=existing.unit,
        date=existing.date
    )


@router.delete("/{record_id}")
async def delete_value_record(record_id: str, db: Session = Depends(get_db)):
    """Delete a value record"""
    repo = ValueTrackingRepository(db)
    if not repo.exists(record_id):
        raise HTTPException(status_code=404, detail="Value record not found")
    
    repo.delete(record_id)
    return {"message": "Value record deleted successfully"}


# ROI Calculator endpoints
@router.post("/roi/calculate", response_model=ROICalculation)
async def calculate_roi(usecase_id: str, investment: float, returns: float, db: Session = Depends(get_db)):
    """Calculate ROI for a use case"""
    roi_repo = ROIRepository(db)
    
    roi_percentage = ((returns - investment) / investment * 100) if investment > 0 else 0
    monthly_returns = returns / 12 if returns > 0 else 0
    payback_months = int(investment / monthly_returns) if monthly_returns > 0 else 0
    
    roi_id = str(uuid.uuid4())
    db_roi = ROICalculationModel(
        id=roi_id,
        usecase_id=usecase_id,
        investment=investment,
        returns=returns,
        roi_percentage=roi_percentage,
        payback_months=payback_months
    )
    
    result = roi_repo.upsert(db_roi)
    
    return ROICalculation(
        usecase_id=result.usecase_id,
        investment=result.investment,
        returns=result.returns,
        roi_percentage=result.roi_percentage,
        payback_months=result.payback_months
    )


@router.get("/roi/{usecase_id}", response_model=ROICalculation)
async def get_roi_calculation(usecase_id: str, db: Session = Depends(get_db)):
    """Get ROI calculation for a use case"""
    roi_repo = ROIRepository(db)
    r = roi_repo.get_by_usecase(usecase_id)
    if not r:
        raise HTTPException(status_code=404, detail="ROI calculation not found")
    return ROICalculation(
        usecase_id=r.usecase_id,
        investment=r.investment,
        returns=r.returns,
        roi_percentage=r.roi_percentage,
        payback_months=r.payback_months
    )


@router.get("/roi/", response_model=List[ROICalculation])
async def get_all_roi_calculations(db: Session = Depends(get_db)):
    """Get all ROI calculations"""
    roi_repo = ROIRepository(db)
    results = roi_repo.get_all()
    return [
        ROICalculation(
            usecase_id=r.usecase_id,
            investment=r.investment,
            returns=r.returns,
            roi_percentage=r.roi_percentage,
            payback_months=r.payback_months
        )
        for r in results
    ]


@router.get("/kpis/available")
async def get_available_kpis():
    """Get list of commonly used KPIs"""
    return [
        {"name": "Cost Savings", "unit": "$", "category": "Financial"},
        {"name": "Revenue Increase", "unit": "$", "category": "Financial"},
        {"name": "Time Saved", "unit": "hours", "category": "Efficiency"},
        {"name": "Error Reduction", "unit": "%", "category": "Quality"},
        {"name": "Customer Satisfaction", "unit": "score", "category": "Customer"},
        {"name": "Processing Speed", "unit": "ms", "category": "Performance"},
        {"name": "Accuracy", "unit": "%", "category": "Quality"},
        {"name": "Throughput", "unit": "units", "category": "Efficiency"},
        {"name": "Employee Productivity", "unit": "%", "category": "Efficiency"},
        {"name": "Compliance Rate", "unit": "%", "category": "Governance"},
    ]
