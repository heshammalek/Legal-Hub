# backend/app/models/notifications/notification_model.py
import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

class NotificationType(str, Enum):
    DELEGATION_REQUEST = "delegation_request"
    DELEGATION_ACCEPTED = "delegation_accepted" 
    DELEGATION_REJECTED = "delegation_rejected"
    CONSULTATION_REQUEST = "consultation_request"
    EMERGENCY_REQUEST = "emergency_request"
    CASE_UPDATE = "case_update"
    SESSION_REMINDER = "session_reminder"
    DEADLINE_REMINDER = "deadline_reminder"
    SYSTEM_ANNOUNCEMENT = "system_announcement"
    AGENDA_EVENT = "agenda_event"

class NotificationStatus(str, Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"

class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    recipient_id: str = Field(foreign_key="users.id")
    lawyer_id: Optional[str] = Field(default=None, foreign_key="lawyer_profiles.id")
    
    title: str
    message: str
    type: str  # استخدام string بدلاً من Enum لتجنب مشاكل التسلسل
    status: str = Field(default="unread")  # استخدام string بدلاً من Enum
    related_model: Optional[str] = None
    related_id: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None

    # إزالة العلاقات المؤقتاً لتجنب المشاكل
    # recipient: "User" = Relationship()
    # lawyer: Optional["LawyerProfile"] = Relationship()