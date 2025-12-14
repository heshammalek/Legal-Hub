from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from enum import Enum

# حالة الطلب
class DelegationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

# الحقول المشتركة بين جميع النماذج
class DelegationRequestBase(BaseModel):
    court_name: str
    circuit: str
    case_number: str
    case_date: datetime
    roll: Optional[str] = None
    required_action: str
    financial_offer: Optional[float] = None
    contact_phone: Optional[str] = None
    whatsapp_number: str
    whatsapp_url: Optional[str] = None
    requester_signature: Optional[str] = None
    registration_number: str
    power_of_attorney_number: str
    actor_role: Optional[str] = None
    delegation_identity: Optional[str] = None

# نموذج الإدخال لإنشاء طلب جديد
class DelegationRequestCreate(DelegationRequestBase):
    pass

# النموذج الأساسي
class DelegationRequest(DelegationRequestBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    status: DelegationStatus
    requester_lawyer_id: str
    accepter_lawyer_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    accepted_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

# نموذج استجابة مخصص للإنابات المتاحة مع بيانات المحامي
class DelegationRequestWithLawyer(DelegationRequest):
    # بيانات المحامي المضافة
    requester_lawyer_name: Optional[str] = None
    requester_bar_association: Optional[str] = None
    requester_office_address: Optional[str] = None