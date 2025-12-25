from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Assessment Models
class AssessmentScores(BaseModel):
    data_readiness: float
    technology: float
    talent: float
    governance: float
    business_alignment: float


class AssessmentCreate(BaseModel):
    organization_name: str
    scores: AssessmentScores


class Assessment(BaseModel):
    id: str
    organization_id: str
    organization_name: str
    date: datetime
    scores: AssessmentScores
    recommendations: List[str]


# Use Case Models
class DataAvailability(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class UseCaseStatus(str, Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"
    in_progress = "in_progress"
    completed = "completed"


class UseCaseCreate(BaseModel):
    title: str
    description: str
    department: str
    problem_statement: str
    expected_outcomes: str
    data_availability: DataAvailability
    impact_score: float
    feasibility_score: float
    risk_score: float
    timeline_estimate: str


class UseCase(BaseModel):
    id: str
    title: str
    description: str
    department: str
    problem_statement: str
    expected_outcomes: str
    data_availability: DataAvailability
    impact_score: float
    feasibility_score: float
    risk_score: float
    timeline_estimate: str
    status: UseCaseStatus
    created_at: datetime


# Governance Models
class RiskCategory(str, Enum):
    bias = "bias"
    security = "security"
    compliance = "compliance"
    operational = "operational"
    privacy = "privacy"


class RiskSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Risk(BaseModel):
    category: RiskCategory
    description: str
    severity: RiskSeverity
    mitigation: Optional[str] = None


class EvaluationMetric(BaseModel):
    name: str
    value: float
    threshold: float


class ModelCardCreate(BaseModel):
    model_name: str
    version: str
    purpose: str
    owner: str
    training_data: str


class ModelCard(BaseModel):
    id: str
    model_name: str
    version: str
    purpose: str
    owner: str
    training_data: str
    evaluation_metrics: List[EvaluationMetric]
    risks: List[Risk]
    mitigations: List[str]
    created_at: datetime
    updated_at: datetime


# Value Tracking Models
class ValueRecordCreate(BaseModel):
    usecase_id: str
    usecase_title: str
    kpi: str
    value: float
    target: float
    unit: str


class ValueRecord(BaseModel):
    id: str
    usecase_id: str
    usecase_title: str
    kpi: str
    value: float
    target: float
    unit: str
    date: datetime


class ROICalculation(BaseModel):
    usecase_id: str
    investment: float
    returns: float
    roi_percentage: float
    payback_months: int


# Blueprint Models
class BlueprintCategory(str, Enum):
    rag = "rag"
    multi_agent = "multi-agent"
    mlops = "mlops"
    real_time = "real-time"
    data_pipeline = "data-pipeline"


class BlueprintComponent(BaseModel):
    name: str
    type: str
    description: str
    technologies: List[str]


class Blueprint(BaseModel):
    id: str
    name: str
    category: BlueprintCategory
    description: str
    diagram: str
    components: List[BlueprintComponent]
    best_practices: List[str]
    implementation_steps: List[str]


# Learning Models
class LearningRole(str, Enum):
    executive = "executive"
    manager = "manager"
    engineer = "engineer"
    analyst = "analyst"


class LearningModule(BaseModel):
    id: str
    title: str
    role: LearningRole
    description: str
    content: str
    duration: int
    completed: bool = False


class LearningPath(BaseModel):
    id: str
    title: str
    role: LearningRole
    description: str
    modules: List[LearningModule]
    progress: int = 0


class TemplateCategory(str, Enum):
    communication = "communication"
    stakeholder = "stakeholder"
    adoption = "adoption"


class ChangeTemplate(BaseModel):
    id: str
    title: str
    category: TemplateCategory
    content: str
