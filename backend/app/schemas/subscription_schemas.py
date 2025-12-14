# backend/app/schemas/subscription_schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PlanType(str, Enum):
    BASIC = "basic"
    PROFESSIONAL = "professional" 
    ENTERPRISE = "enterprise"

class MembershipPlanBase(BaseModel):
    name: str
    price_monthly: float
    price_yearly: float
    max_cases: int
    max_consultations: int
    storage_gb: int
    features: List[str]
    is_active: bool = True

class MembershipPlanCreate(MembershipPlanBase):
    pass

class MembershipPlanResponse(MembershipPlanBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserSubscriptionBase(BaseModel):
    plan_id: str
    auto_renew: bool = True

class UserSubscriptionCreate(UserSubscriptionBase):
    pass

class UserSubscriptionResponse(UserSubscriptionBase):
    id: str
    user_id: str
    plan: MembershipPlanResponse
    start_date: datetime
    end_date: datetime
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    amount: float
    due_date: datetime

class InvoiceResponse(InvoiceBase):
    id: str
    invoice_number: str
    subscription_id: str
    issue_date: datetime
    status: str
    pdf_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# 🔐 Schemas جديدة لنظام OPS
class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str

class CurrentUserInfo(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str]
    current_plan: str
    plan_status: str

class ChangePasswordWithOTP(BaseModel):
    """تغيير كلمة المرور باستخدام OTP"""
    email: str
    otp: str
    new_password: str
    confirm_password: str

class OTPResponse(BaseModel):
    """رد على طلب OTP"""
    message: str
    otp_sent_to: str
    success: bool = True

class LawyerProfileUpdate(BaseModel):
    """تحديث بيانات المحامي (بدون بريد إلكتروني)"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    specialization: Optional[str] = None
    bio: Optional[str] = None
    office_address: Optional[str] = None

class LawyerSettingsResponse(BaseModel):
    profile: dict
    subscription: Optional[UserSubscriptionResponse] = None
    invoices: List[InvoiceResponse] = []