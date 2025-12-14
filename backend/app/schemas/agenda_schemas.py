# backend/app/schemas/agenda_schemas.py

from sqlmodel import SQLModel
from typing import Optional
from datetime import datetime
from enum import Enum

class EventType(str, Enum):
    SESSION = "session"
    CONSULTATION = "consultation" 
    DEADLINE = "deadline"
    MEETING = "meeting"
    TASK = "task"
    PERSONAL = "personal"

class EventBase(SQLModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    event_type: EventType = EventType.TASK
    is_all_day: bool = False
    location: Optional[str] = None
    color: Optional[str] = None
    rrule: Optional[str] = None
    reminder_minutes_before: Optional[int] = None

class EventCreate(EventBase):
    pass

class EventUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    event_type: Optional[EventType] = None
    is_all_day: Optional[bool] = None
    location: Optional[str] = None
    color: Optional[str] = None
    rrule: Optional[str] = None
    reminder_minutes_before: Optional[int] = None

class EventRead(EventBase):
    id: str
    lawyer_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True