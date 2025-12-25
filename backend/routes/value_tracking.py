from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import random

from models import ValueRecord, ValueRecordCreate, ROICalculation

router = APIRouter()

# In-memory storage
value_records_db: dict[str, ValueRecord] = {}
roi_calculations_db: dict[str, ROICalculation] = {}


@router.get("/", response_model=List[ValueRecord])
async def get_value_records(
    usecase_id: Optional[str] = None,
    kpi: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get all value records with optional filters"""
    results = list(value_records_db.values())
    
    if usecase_id:
        results = [vr for vr in results if vr.usecase_id == usecase_id]
    
    if kpi:
        results = [vr for vr in results if vr.kpi.lower() == kpi.lower()]
    
    if start_date:
        results = [vr for vr in results if vr.date >= start_date]
    
    if end_date:
        results = [vr for vr in results if vr.date <= end_date]
    
    return sorted(results, key=lambda x: x.date, reverse=True)


@router.get("/trends")
async def get_value_trends(
    usecase_id: Optional[str] = None,
    period: str = Query("month", regex="^(week|month|quarter|year)$")
):
    """Get value trends over time"""
    records = list(value_records_db.values())
    
    if usecase_id:
        records = [r for r in records if r.usecase_id == usecase_id]
    
    # Group by KPI and date
    trends = {}
    for record in records:
        if record.kpi not in trends:
            trends[record.kpi] = []
        trends[record.kpi].append({
            "date": record.date.isoformat(),
            "value": record.value,
            "target": record.target,
            "achievement": (record.value / record.target * 100) if record.target > 0 else 0
        })
    
    return trends


@router.get("/dashboard")
async def get_value_dashboard():
    """Get dashboard summary of value tracking"""
    records = list(value_records_db.values())
    roi_calcs = list(roi_calculations_db.values())
    
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
async def get_value_record(record_id: str):
    """Get a specific value record by ID"""
    if record_id not in value_records_db:
        raise HTTPException(status_code=404, detail="Value record not found")
    return value_records_db[record_id]


@router.post("/", response_model=ValueRecord)
async def create_value_record(data: ValueRecordCreate):
    """Create a new value record"""
    record_id = str(uuid.uuid4())
    
    record = ValueRecord(
        id=record_id,
        usecase_id=data.usecase_id,
        usecase_title=data.usecase_title,
        kpi=data.kpi,
        value=data.value,
        target=data.target,
        unit=data.unit,
        date=datetime.utcnow()
    )
    
    value_records_db[record_id] = record
    return record


@router.put("/{record_id}", response_model=ValueRecord)
async def update_value_record(record_id: str, data: ValueRecordCreate):
    """Update an existing value record"""
    if record_id not in value_records_db:
        raise HTTPException(status_code=404, detail="Value record not found")
    
    existing = value_records_db[record_id]
    
    updated = ValueRecord(
        id=record_id,
        usecase_id=data.usecase_id,
        usecase_title=data.usecase_title,
        kpi=data.kpi,
        value=data.value,
        target=data.target,
        unit=data.unit,
        date=existing.date
    )
    
    value_records_db[record_id] = updated
    return updated


@router.delete("/{record_id}")
async def delete_value_record(record_id: str):
    """Delete a value record"""
    if record_id not in value_records_db:
        raise HTTPException(status_code=404, detail="Value record not found")
    
    del value_records_db[record_id]
    return {"message": "Value record deleted successfully"}


# ROI Calculator endpoints
@router.post("/roi/calculate", response_model=ROICalculation)
async def calculate_roi(usecase_id: str, investment: float, returns: float):
    """Calculate ROI for a use case"""
    roi_percentage = ((returns - investment) / investment * 100) if investment > 0 else 0
    
    # Simple payback calculation
    monthly_returns = returns / 12 if returns > 0 else 0
    payback_months = int(investment / monthly_returns) if monthly_returns > 0 else 0
    
    calculation = ROICalculation(
        usecase_id=usecase_id,
        investment=investment,
        returns=returns,
        roi_percentage=roi_percentage,
        payback_months=payback_months
    )
    
    roi_calculations_db[usecase_id] = calculation
    return calculation


@router.get("/roi/{usecase_id}", response_model=ROICalculation)
async def get_roi_calculation(usecase_id: str):
    """Get ROI calculation for a use case"""
    if usecase_id not in roi_calculations_db:
        raise HTTPException(status_code=404, detail="ROI calculation not found")
    return roi_calculations_db[usecase_id]


@router.get("/roi/", response_model=List[ROICalculation])
async def get_all_roi_calculations():
    """Get all ROI calculations"""
    return list(roi_calculations_db.values())


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
