# backend/app/models/JudicialCase.py
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid
from sqlalchemy import Column, String, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.models.user_models import LawyerProfile

class CaseStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active" 
    PENDING = "pending"
    IN_SESSION = "in_session"
    APPEAL = "appeal"
    CLOSED = "closed"
    ARCHIVED = "archived"

class CasePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class JudicialCase(SQLModel, table=True):
    __tablename__ = "judicial_cases"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    
    case_number: str = Field(unique=True, index=True, max_length=100)
    title: str = Field(max_length=500)
    description: Optional[str] = Field(default=None, sa_column=Column(Text))
    case_type: Optional[str] = Field(default=None, max_length=200)
    court: Optional[str] = Field(default=None, max_length=300)
    registration_date: Optional[date] = Field(default=None)
    
    status: CaseStatus = Field(default=CaseStatus.DRAFT)
    priority: CasePriority = Field(default=CasePriority.MEDIUM)
    
    # JSON fields
    parties: List[Dict[str, Any]] = Field(
        default=[],
        sa_column=Column(JSON, default=[])
    )
    sessions: List[Dict[str, Any]] = Field(
        default=[],
        sa_column=Column(JSON, default=[])
    )
    documents: List[Dict[str, Any]] = Field(
        default=[],
        sa_column=Column(JSON, default=[])
    )
    team: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSON)
    )
    
    # Financial
    fees: Optional[float] = Field(default=None)
    expenses: Optional[float] = Field(default=None)
    payment_status: Optional[str] = Field(default=None, max_length=100)
    
    # Analytics
    success_probability: Optional[float] = Field(default=None, ge=0, le=100)
    
    # العلاقة مع LawyerProfile
    created_by: str = Field(foreign_key="lawyer_profiles.id")
    
    # Additional JSON fields
    tags: List[str] = Field(default=[], sa_column=Column(JSON, default=[]))
    milestones: List[Dict[str, Any]] = Field(default=[], sa_column=Column(JSON, default=[]))
    reminders: List[Dict[str, Any]] = Field(default=[], sa_column=Column(JSON, default=[]))
    
    # Timestamps
    created_at: Optional[datetime] = Field(
        default_factory=datetime.now,
        sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: Optional[datetime] = Field(
        default_factory=datetime.now,
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()}
    )
    
    last_updated: Optional[datetime] = Field(
        default_factory=datetime.now,
        sa_column_kwargs={"onupdate": func.now(), "server_default": func.now()}
    )
    
    # العلاقة
    lawyer: Optional["LawyerProfile"] = Relationship()