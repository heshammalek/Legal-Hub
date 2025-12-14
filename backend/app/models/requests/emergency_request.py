# backend/app/models/requests/emergency_request.py

from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum
import uuid

class EmergencyStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class EmergencyPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class EmergencyLawyerRequest(SQLModel, table=True):
    __tablename__ = "emergency_lawyer_requests"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    assigned_lawyer_id: Optional[str] = Field(default=None, foreign_key="lawyer_profiles.id", index=True)
    preferred_lawyer_id: Optional[str] = Field(default=None, index=True)  # جديد
    
    description: str
    user_latitude: float
    user_longitude: float
    user_location_name: Optional[str] = None
    preferred_specialization: Optional[str] = None
    priority: str = Field(default="medium")
    
    contact_phone: Optional[str] = None
    contact_method: str = Field(default="app")
    
    voice_note_filename: Optional[str] = None
    voice_note_url: Optional[str] = None
    voice_note_duration: Optional[int] = None
    
    status: str = Field(default="pending", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    expires_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    lawyer_response_time: Optional[datetime] = None
    
    is_notified: bool = Field(default=False)
    notification_count: int = Field(default=0)
    
    user_notes: Optional[str] = None
    lawyer_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    
    user_rating: Optional[int] = None
    user_feedback: Optional[str] = None


class EmergencyRequestCreate(SQLModel):
    description: str
    user_latitude: float
    user_longitude: float
    user_location_name: Optional[str] = None
    preferred_specialization: Optional[str] = None
    priority: str = "medium"
    contact_phone: Optional[str] = None
    contact_method: str = "app"
    user_notes: Optional[str] = None
    preferred_lawyer_id: Optional[str] = None


class LawyerContactInfo(SQLModel):
    lawyer_id: str
    lawyer_name: str
    phone: Optional[str]
    whatsapp_link: Optional[str]
    specialization: str
    rating: float