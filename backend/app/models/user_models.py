from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime, date
from enum import Enum
import uuid
from typing import Optional, List, TYPE_CHECKING
from app.models.agenda_models import EventDocumentLink


# استيراد شرطي لتجنب Circular Import
if TYPE_CHECKING:
    from app.models.agenda_models import Event
    from app.models.requests.emergency_request import EmergencyLawyerRequest
    from app.models.requests.delegation_request import DelegationRequest
    from app.models.requests.peer_question import PeerQuestion
    from app.models.requests.peer_answer import PeerAnswer

    
    sent_delegations: List["DelegationRequest"]
    accepted_delegations: List["DelegationRequest"]
    
    from app.models.requests.delegation_request import DelegationRequest



# 🎭 Enums
class UserRole(str, Enum):
    ORDINARY = "ordinary"
    LAWYER = "lawyer"
    ADMIN = "admin"
    JUDGE = "judge"
    EXPERT = "expert"

class MembershipStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"
    REJECTED = "rejected"

class AvailabilityStatus(str, Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"
    EMERGENCY = "emergency"

class LawyerDegree(str, Enum):
    TRAINEE = "trainee"
    JUNIOR = "junior"
    SENIOR = "senior"
    CONSULTANT = "consultant"

class PaymentMethod(str, Enum):
    BANK = "bank"
    INSTAPAY = "instapay"
    WALLET = "wallet"
    VODAFONE_CASH = "vodafone_cash"

class ServiceType(str, Enum):
    LEGAL = "legal"
    TECHNICAL = "technical"
    MEDICAL = "medical"
    FINANCIAL = "financial"
    OTHER = "other"

class CaseStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# 👤 User Table
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    phone: str = Field(unique=True, index=True)
    country: str
    password_hash: str
    role: UserRole
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    login_count: int = Field(default=0)

    profile: Optional["UserProfile"] = Relationship(back_populates="user")

# 🧾 Unified Profile Table
class UserProfile(SQLModel, table=True):
    __tablename__ = "user_profiles"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id")
    full_name: str
    national_id: str = Field(unique=True, index=True)
    date_of_birth: Optional[date] = None
    role: UserRole

    user: User = Relationship(back_populates="profile")
    lawyer_profile: Optional["LawyerProfile"] = Relationship(
        back_populates="profile",
        sa_relationship_kwargs={"foreign_keys": "[LawyerProfile.profile_id]"}
    )
    judge_profile: Optional["JudgeProfile"] = Relationship(
        back_populates="profile", 
        sa_relationship_kwargs={"foreign_keys": "[JudgeProfile.profile_id]"}
    )
    expert_profile: Optional["ExpertProfile"] = Relationship(
        back_populates="profile",
        sa_relationship_kwargs={"foreign_keys": "[ExpertProfile.profile_id]"}
    )
    
   



# ⚖️ Lawyer Profile
class LawyerProfile(SQLModel, table=True):
    __tablename__ = "lawyer_profiles"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    profile_id: str = Field(foreign_key="user_profiles.id")
    country: str = Field(default="Egypt")
    bar_association: str
    registration_year: int
    degree: LawyerDegree
    specialization: str
    registration_number: str = Field(unique=True)
    office_address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    membership_status: MembershipStatus = Field(default=MembershipStatus.PENDING)
    membership_start: Optional[datetime] = None
    membership_end: Optional[datetime] = None
    availability_status: AvailabilityStatus = Field(default=AvailabilityStatus.OFFLINE)
    rating: float = Field(default=0.0, ge=0, le=5)
    total_earnings: float = Field(default=0.0, ge=0)
    pending_amount: float = Field(default=0.0, ge=0)
    emergency_available: bool = Field(default=False)
    #events: List["Event"] = Relationship(back_populates="lawyer")
    #profile: "UserProfile" = Relationship(back_populates="lawyer_profile")
    payments: List["PaymentInfo"] = Relationship(back_populates="lawyer")
    bio: Optional[str] = Field(default=None)  # إضافة
    experience_years: int = Field(default=0)  # إضافة
    profile: UserProfile = Relationship(
        back_populates="lawyer_profile",
        sa_relationship_kwargs={"foreign_keys": "[LawyerProfile.profile_id]"}
    )
   # ✅ علاقات الإنابة
    sent_delegations: List["DelegationRequest"] = Relationship(
        back_populates="requester_lawyer",
        sa_relationship_kwargs={
            "foreign_keys": "DelegationRequest.requester_lawyer_id",
            "lazy": "dynamic"
        }
    )
    
    accepted_delegations: List["DelegationRequest"] = Relationship(
        back_populates="accepter_lawyer",
        sa_relationship_kwargs={
            "foreign_keys": "DelegationRequest.accepter_lawyer_id",
            "lazy": "dynamic"
        }
    )
    
    
    # ✅ علاقة الأحداث (الأجندة) - مع تحديد foreign_keys بشكل صحيح
 #   events: List["Event"] = Relationship(
 #       back_populates="lawyer",
 #       sa_relationship_kwargs={
  #          "foreign_keys": "[Event.lawyer_id]",
 #           "lazy": "dynamic"  # استخدام dynamic لتجنب تحميل جميع الأحداث مرة واحدة
 #       }
 #   )



# 🧑‍⚖️ Judge Profile
class JudgeProfile(SQLModel, table=True):
    __tablename__ = "judge_profiles"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    profile_id: str = Field(foreign_key="user_profiles.id")
    registration_number: str = Field(unique=True)
    degree: str
    court: str
    court_circuit: str
    is_active: bool = Field(default=True)

    profile: UserProfile = Relationship(back_populates="judge_profile")

# 🧠 Expert Profile
class ExpertProfile(SQLModel, table=True):
    __tablename__ = "expert_profiles"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    profile_id: str = Field(foreign_key="user_profiles.id")
    workplace: str
    service_type: ServiceType
    specialization: str
    availability_status: AvailabilityStatus = Field(default=AvailabilityStatus.OFFLINE)
    rating: float = Field(default=0.0, ge=0, le=5)
    total_earnings: float = Field(default=0.0, ge=0)
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    profile: UserProfile = Relationship(back_populates="expert_profile")
    payments: List["PaymentInfo"] = Relationship(back_populates="expert")

# 💳 Payment Info
class PaymentInfo(SQLModel, table=True):
    __tablename__ = "payment_info"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    method: PaymentMethod
    encrypted_details: str
    verified: bool = Field(default=False)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    lawyer_id: Optional[str] = Field(default=None, foreign_key="lawyer_profiles.id")
    expert_id: Optional[str] = Field(default=None, foreign_key="expert_profiles.id")

    lawyer: Optional[LawyerProfile] = Relationship(back_populates="payments")
    expert: Optional[ExpertProfile] = Relationship(back_populates="payments")

# 📄 Legal Document Model
class LegalDocument(SQLModel, table=True):
    __tablename__ = "legal_documents"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    uploaded_by_id: str = Field(foreign_key="users.id")

    uploaded_by: Optional[User] = Relationship()
    
#    events: List["Event"] = Relationship(
#        back_populates="documents", link_model=EventDocumentLink
#    )



# ⚖️ Case Model



class Case(SQLModel, table=True):
    __tablename__ = "cases"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    description: str
    status: CaseStatus = Field(default=CaseStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None

    assigned_lawyer_id: Optional[str] = Field(default=None, foreign_key="lawyer_profiles.id")
    judge_id: Optional[str] = Field(default=None, foreign_key="judge_profiles.id")
    verdict: Optional[str] = None


    judge_id: Optional[str] = Field(default=None, foreign_key="judge_profiles.id")
    judge: Optional["JudgeProfile"] = Relationship()

    assigned_lawyer: Optional[LawyerProfile] = Relationship()
    judge: Optional["JudgeProfile"] = Relationship()



# 🧑‍⚖️ Prosecutor model

class ProsecutorProfile(SQLModel, table=True):
    __tablename__ = "prosecutor_profiles"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    title: Optional[str] = Field(default="وكيل نيابة")  # أو "رئيس نيابة"
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_info: Optional[str] = None  # لو حبيت تضيف عنوان أو بيانات إضافية


# 🧑‍💼 Prosecution Secretary model

class ProsecutionSecretaryProfile(SQLModel, table=True):
    __tablename__ = "prosecution_secretaries"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = Field(default="سكرتير نيابة")  # يمكن تغييره حسب الدور
    contact_info: Optional[str] = None  # عنوان أو بيانات إضافية


# 🧑‍⚖️ Court Secretary model
class CourtSecretaryProfile(SQLModel, table=True):
    __tablename__ = "court_secretaries"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    title: Optional[str] = Field(default="أمين سر")  # أو "سكرتير جلسة"
    contact_info: Optional[str] = None


# 📝 Contact model
class ContactMessage(SQLModel, table=True):
    __tablename__ = "contact_messages"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    full_name: str
    email: str
    phone: str
    subject: str
    message: str
    contact_method: str  # ممكن تعملها Enum لو حبيت
    status: str = Field(default="new")
    created_at: datetime = Field(default_factory=datetime.utcnow)



# جداول الاشتراكات والإعدادات الجديدة
class MembershipPlan(SQLModel, table=True):
    __tablename__ = "membership_plans"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    price_monthly: float
    price_yearly: float
    max_cases: int
    max_consultations: int
    storage_gb: int
    features: str  # JSON string للخدمات
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserSubscription(SQLModel, table=True):
    __tablename__ = "user_subscriptions"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id")
    plan_id: str = Field(foreign_key="membership_plans.id")
    start_date: datetime
    end_date: datetime
    status: str  # active, expired, cancelled
    auto_renew: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Invoice(SQLModel, table=True):
    __tablename__ = "invoices"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    subscription_id: str = Field(foreign_key="user_subscriptions.id")
    invoice_number: str = Field(unique=True)
    amount: float
    issue_date: datetime
    due_date: datetime
    status: str  # paid, pending, overdue
    pdf_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)