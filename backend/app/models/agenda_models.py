# backend/app/models/agenda_models.py

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class EventType(str, Enum):
    SESSION = "session"
    CONSULTATION = "consultation" 
    DEADLINE = "deadline"
    MEETING = "meeting"
    TASK = "task"
    PERSONAL = "personal"

class EventDocumentLink(SQLModel, table=True):
    __tablename__ = "event_document_link"
    event_id: Optional[str] = Field(
        default=None, foreign_key="events.id", primary_key=True
    )
    document_id: Optional[str] = Field(
        default=None, foreign_key="legal_documents.id", primary_key=True
    )

class Event(SQLModel, table=True):
    __tablename__ = "events"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str = Field(index=True)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    event_type: EventType = EventType.TASK
    is_all_day: bool = Field(default=False)
    location: Optional[str] = None
    color: Optional[str] = None
    rrule: Optional[str] = None
    reminder_minutes_before: Optional[int] = None
    
    # ✅ إصلاح الأعمدة الزمنية - إضافة created_at وإصلاح updated_at
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # العلاقات الأساسية
    lawyer_id: str = Field(foreign_key="lawyer_profiles.id")