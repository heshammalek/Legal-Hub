from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
import uuid
from enum import Enum
from datetime import datetime, timedelta  
from app.models.user_models import User, LawyerProfile

class ConsultationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    PAYMENT_PENDING = "payment_pending"
    PAYMENT_COMPLETED = "payment_completed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class ConsultationRequest(SQLModel, table=True):
    __tablename__ = "consultation_requests"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id")
    lawyer_id: str = Field(foreign_key="lawyer_profiles.id")

    # المعلومات الأساسية
    subject: str
    message: str
    country: str  # ✅ الدولة المطلوبة
    category: str  # ✅ التخصص القانوني
    urgency_level: str = Field(default="normal")  # low, normal, high
    
    # حالة الطلب
    status: ConsultationStatus = Field(default=ConsultationStatus.PENDING)
    
    # معلومات الدفع والجلسة
    consultation_fee: float = Field(default=0.0)
    duration_minutes: int = Field(default=30)
    payment_intent_id: Optional[str] = None
    payment_status: str = Field(default="pending")
    
    # التوقيتات
    created_at: datetime = Field(default_factory=datetime.utcnow)
    responded_at: Optional[datetime] = None
    scheduled_time: Optional[datetime] = None  # ✅ موعد الجلسة
    
    # الإشعارات
    is_notified: bool = Field(default=False)
    rejection_reason: Optional[str] = None  # ✅ سبب الرفض

    # العلاقات
    user: Optional[User] = Relationship()
    lawyer: Optional[LawyerProfile] = Relationship()
    session: Optional["ConsultationSession"] = Relationship(back_populates="consultation")  # ✅ الجلسة

# ✅ نموذج جلسة الاستشارة
class ConsultationSession(SQLModel, table=True):
    __tablename__ = "consultation_sessions"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    consultation_id: str = Field(foreign_key="consultation_requests.id")
    
    # معلومات الجلسة
    room_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_url: Optional[str] = None
    meeting_password: Optional[str] = None
    
    # إعدادات الجلسة
    video_enabled: bool = Field(default=True)
    audio_enabled: bool = Field(default=True)
    chat_enabled: bool = Field(default=True)
    document_sharing_enabled: bool = Field(default=True)
    
    # توقيتات الجلسة
    scheduled_time: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    actual_duration: Optional[int] = None  # المدة الفعلية بالدقائق
    
    # العلاقات
    consultation: ConsultationRequest = Relationship(back_populates="session")