"""
SQLAlchemy database models for PostgreSQL.
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text, 
    ForeignKey, Enum as SQLEnum, JSON, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from database import Base
import enum


# ============== Enums ==============

class DataAvailability(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class UseCaseStatus(str, enum.Enum):
    draft = "draft"
    submitted = "submitted"
    approved = "approved"
    in_progress = "in_progress"
    completed = "completed"


class RiskCategory(str, enum.Enum):
    bias = "bias"
    security = "security"
    compliance = "compliance"
    operational = "operational"
    privacy = "privacy"


class RiskSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class MaturityLevel(str, enum.Enum):
    novice = "novice"
    developing = "developing"
    proficient = "proficient"
    advanced = "advanced"
    leading = "leading"


class InitiativeStatus(str, enum.Enum):
    todo = "todo"
    in_progress = "in-progress"
    done = "done"


class AssistantStatus(str, enum.Enum):
    active = "active"
    trial = "trial"
    pending = "pending"
    cancelled = "cancelled"


# ============== Assessment Models ==============

class AssessmentModel(Base):
    __tablename__ = "assessments"
    
    id = Column(String, primary_key=True)
    organization_id = Column(String, nullable=False, index=True)
    organization_name = Column(String, nullable=False, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    
    # Scores stored as JSON for flexibility
    scores = Column(JSONB, nullable=False)
    # data_readiness, technology, talent, governance, business_alignment
    
    recommendations = Column(ARRAY(String), default=[])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============== Use Case Models ==============

class UseCaseModel(Base):
    __tablename__ = "use_cases"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    department = Column(String, nullable=False, index=True)
    problem_statement = Column(Text)
    expected_outcomes = Column(Text)
    data_availability = Column(SQLEnum(DataAvailability), default=DataAvailability.medium)
    impact_score = Column(Float, default=0)
    feasibility_score = Column(Float, default=0)
    risk_score = Column(Float, default=0)
    timeline_estimate = Column(String)
    status = Column(SQLEnum(UseCaseStatus), default=UseCaseStatus.draft, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============== Governance Models ==============

class ModelCardModel(Base):
    __tablename__ = "model_cards"
    
    id = Column(String, primary_key=True)
    model_name = Column(String, nullable=False, index=True)
    version = Column(String, nullable=False)
    purpose = Column(Text)
    owner = Column(String, nullable=False, index=True)
    training_data = Column(Text)
    
    # Stored as JSONB for flexibility
    evaluation_metrics = Column(JSONB, default=[])
    # Each metric: {name, value, threshold}
    
    mitigations = Column(ARRAY(String), default=[])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to risks
    risks = relationship("RiskModel", back_populates="model_card", cascade="all, delete-orphan")


class RiskModel(Base):
    __tablename__ = "risks"
    
    id = Column(String, primary_key=True)
    model_card_id = Column(String, ForeignKey("model_cards.id"), nullable=False, index=True)
    category = Column(SQLEnum(RiskCategory), nullable=False)
    description = Column(Text)
    severity = Column(SQLEnum(RiskSeverity), default=RiskSeverity.medium)
    mitigation = Column(Text)
    
    model_card = relationship("ModelCardModel", back_populates="risks")


# ============== Value Tracking Models ==============

class ValueRecordModel(Base):
    __tablename__ = "value_records"
    
    id = Column(String, primary_key=True)
    usecase_id = Column(String, index=True)
    usecase_title = Column(String)
    kpi = Column(String, nullable=False, index=True)
    value = Column(Float, nullable=False)
    target = Column(Float, nullable=False)
    unit = Column(String)
    date = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class ROICalculationModel(Base):
    __tablename__ = "roi_calculations"
    
    id = Column(String, primary_key=True)
    usecase_id = Column(String, unique=True, index=True)
    investment = Column(Float, nullable=False)
    returns = Column(Float, nullable=False)
    roi_percentage = Column(Float)
    payback_months = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============== AI Assistant Models ==============

class AIAssistantModel(Base):
    __tablename__ = "ai_assistants"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, index=True)
    vendor = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String, default="other", index=True)
    monthly_price = Column(Float, default=0)
    licenses = Column(Integer, default=0)
    active_users = Column(Integer, default=0)
    contract_start = Column(String)
    contract_end = Column(String)
    status = Column(SQLEnum(AssistantStatus), default=AssistantStatus.pending, index=True)
    features = Column(ARRAY(String), default=[])
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============== AI Initiative Models ==============

class AIInitiativeModel(Base):
    __tablename__ = "ai_initiatives"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    team = Column(String, nullable=False, index=True)
    sponsor = Column(String, nullable=False)
    status = Column(String, default="todo", index=True)  # 'todo' | 'in-progress' | 'done'
    start_date = Column(String)
    target_date = Column(String)
    ai_assistants = Column(ARRAY(String), default=[])
    objectives = Column(ARRAY(String), default=[])
    progress = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    action_items = relationship("ActionItemModel", back_populates="initiative", cascade="all, delete-orphan")
    risks = relationship("InitiativeRiskModel", back_populates="initiative", cascade="all, delete-orphan")


class ActionItemModel(Base):
    __tablename__ = "action_items"
    
    id = Column(String, primary_key=True)
    initiative_id = Column(String, ForeignKey("ai_initiatives.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    assignee = Column(String)
    due_date = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    initiative = relationship("AIInitiativeModel", back_populates="action_items")


class InitiativeRiskModel(Base):
    __tablename__ = "initiative_risks"
    
    id = Column(String, primary_key=True)
    initiative_id = Column(String, ForeignKey("ai_initiatives.id"), nullable=False, index=True)
    category = Column(String, nullable=False)
    description = Column(Text)
    severity = Column(String, default="medium")
    mitigation = Column(Text)
    owner = Column(String)
    status = Column(String, default="open")
    
    initiative = relationship("AIInitiativeModel", back_populates="risks")


# ============== Team Maturity Models ==============

class TeamMaturityModel(Base):
    __tablename__ = "team_maturity"
    
    id = Column(String, primary_key=True)
    team = Column(String, nullable=False, index=True)
    department = Column(String, nullable=False, index=True)
    assessment_date = Column(DateTime, default=datetime.utcnow)
    
    # Scores stored as JSON
    scores = Column(JSONB, nullable=False)
    # adoption, proficiency, integration, governance, innovation
    
    overall_level = Column(SQLEnum(MaturityLevel), default=MaturityLevel.novice)
    strengths = Column(ARRAY(String), default=[])
    improvement_areas = Column(ARRAY(String), default=[])
    recommendations = Column(ARRAY(String), default=[])
    assessor = Column(String, default="AI Enablement Team")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============== Metrics Models ==============

class CopilotMetricsModel(Base):
    """Singleton model for storing Copilot metrics summary and team data."""
    __tablename__ = "copilot_metrics"
    
    id = Column(String, primary_key=True)  # Uses singleton ID
    
    # Summary metrics
    total_active_users = Column(Integer, default=0)
    total_engaged_users = Column(Integer, default=0)
    total_licenses = Column(Integer, default=0)
    acceptance_rate = Column(Float, default=0)
    total_suggestions = Column(Integer, default=0)
    total_acceptances = Column(Integer, default=0)
    total_chats = Column(Integer, default=0)
    
    # Team metrics stored as JSONB array
    # Each team: {org, slug, name, total_active_users, total_engaged_users, acceptance_rate}
    teams = Column(JSONB, default=[])
    
    last_updated = Column(DateTime, default=datetime.utcnow)


# ============== Learning Progress Models ==============

class LearningProgressModel(Base):
    __tablename__ = "learning_progress"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    module_id = Column(String, nullable=False, index=True)
    path_id = Column(String, nullable=False, index=True)
    
    completed_at = Column(DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate completions
    __table_args__ = (
        Index('ix_learning_progress_user_module', 'user_id', 'module_id', unique=True),
    )
