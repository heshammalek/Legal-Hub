# backend/app/schemas/judicial_case_schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

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

class PartyBase(BaseModel):
    type: str
    name: str
    identity_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    lawyer: Optional[str] = None

class SessionBase(BaseModel):
    date: datetime
    location: str
    purpose: str
    judge: Optional[str] = None
    clerk: Optional[str] = None
    prosecutor: Optional[str] = None
    court_recorder: Optional[str] = None
    notes: Optional[str] = None
    documents: List[str] = Field(default_factory=list)
    outcome: Optional[str] = None
    next_session_date: Optional[datetime] = None

class DocumentBase(BaseModel):
    name: str
    type: str
    upload_date: datetime
    file_url: str
    uploaded_by: str
    related_session: Optional[str] = None
    description: Optional[str] = None

class CaseTeam(BaseModel):
    lead_lawyer: str
    assistant_lawyers: List[str] = Field(default_factory=list)
    legal_researchers: List[str] = Field(default_factory=list)
    paralegals: List[str] = Field(default_factory=list)

class Milestone(BaseModel):
    title: str
    date: datetime
    description: str
    completed: bool = False

class Reminder(BaseModel):
    title: str
    due_date: datetime
    priority: CasePriority = CasePriority.MEDIUM
    completed: bool = False

# ========== REQUEST/RESPONSE SCHEMAS ==========

class JudicialCaseCreate(BaseModel):
    case_number: str
    title: str
    description: Optional[str] = None
    case_type: str
    court: str
    registration_date: date
    status: CaseStatus = CaseStatus.DRAFT
    priority: CasePriority = CasePriority.MEDIUM
    parties: List[PartyBase] = Field(default_factory=list)
    sessions: List[SessionBase] = Field(default_factory=list)
    documents: List[DocumentBase] = Field(default_factory=list)
    team: CaseTeam
    fees: Optional[float] = None
    expenses: Optional[float] = None
    payment_status: Optional[str] = None
    success_probability: Optional[float] = None
    created_by: str
    tags: List[str] = Field(default_factory=list)
    milestones: List[Milestone] = Field(default_factory=list)
    reminders: List[Reminder] = Field(default_factory=list)

class JudicialCaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    case_type: Optional[str] = None
    court: Optional[str] = None
    status: Optional[CaseStatus] = None
    priority: Optional[CasePriority] = None
    fees: Optional[float] = None
    expenses: Optional[float] = None
    payment_status: Optional[str] = None
    success_probability: Optional[float] = None
    tags: Optional[List[str]] = None
    parties: Optional[List[PartyBase]] = None
    sessions: Optional[List[SessionBase]] = None
    documents: Optional[List[DocumentBase]] = None
    team: Optional[CaseTeam] = None
    milestones: Optional[List[Milestone]] = None
    reminders: Optional[List[Reminder]] = None

class JudicialCaseResponse(BaseModel):
    id: str
    case_number: str
    title: str
    description: Optional[str] = None
    case_type: str
    court: str
    registration_date: date
    status: CaseStatus
    priority: CasePriority
    parties: List[Dict[str, Any]] = Field(default_factory=list)
    sessions: List[Dict[str, Any]] = Field(default_factory=list)
    documents: List[Dict[str, Any]] = Field(default_factory=list)
    team: Dict[str, Any]
    fees: Optional[float] = None
    expenses: Optional[float] = None
    payment_status: Optional[str] = None
    success_probability: Optional[float] = None
    created_by: str
    tags: List[str] = Field(default_factory=list)
    milestones: List[Dict[str, Any]] = Field(default_factory=list)
    reminders: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    last_updated: datetime

    class Config:
        from_attributes = True