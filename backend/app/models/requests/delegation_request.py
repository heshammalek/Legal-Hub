from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid

from app.models.user_models import LawyerProfile

class DelegationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class DelegationRequest(SQLModel, table=True):
    __tablename__ = "delegation_requests"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)

    # بيانات القضية
    court_name: str = Field(index=True)
    circuit: str
    case_number: str = Field(index=True)
    case_date: datetime
    roll: Optional[str] = None
    required_action: str

    # معلومات التواصل والمالية
    financial_offer: Optional[float] = Field(default=None)
    contact_phone: Optional[str] = Field(default=None)
    whatsapp_number: str = Field(nullable=False)
    whatsapp_url: Optional[str] = Field(default=None)
    
    # بيانات المحامي الطالب
    requester_signature: Optional[str] = None
    registration_number: str
    power_of_attorney_number: str
    
    # معلومات إضافية
    actor_role: Optional[str] = Field(default=None)
    delegation_identity: Optional[str] = Field(default=None)
    
    # حالة الطلب
    status: DelegationStatus = Field(default=DelegationStatus.PENDING)

    # التواريخ
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    # علاقات المحامين
    requester_lawyer_id: str = Field(foreign_key="lawyer_profiles.id")
    accepter_lawyer_id: Optional[str] = Field(default=None, foreign_key="lawyer_profiles.id")

    # العلاقات
    requester_lawyer: Optional[LawyerProfile] = Relationship(
        back_populates="sent_delegations",
        sa_relationship_kwargs={
            "foreign_keys": "DelegationRequest.requester_lawyer_id"
        }
    )
    
    accepter_lawyer: Optional[LawyerProfile] = Relationship(
        back_populates="accepted_delegations",
        sa_relationship_kwargs={
            "foreign_keys": "DelegationRequest.accepter_lawyer_id"
        }
    )