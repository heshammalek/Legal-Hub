from sqlmodel import Session, select
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
from cryptography.fernet import Fernet
import logging

from app.models.requests.consultation_request import ConsultationRequest, ConsultationSession, ConsultationStatus
logger = logging.getLogger(__name__)

from app.core.password_utils import verify_password, get_password_hash
from app.core.config import get_encryption_key
from app.models.user_models import (
    User, UserProfile,
    LawyerProfile, JudgeProfile, ExpertProfile,
    PaymentInfo,
    UserRole, LawyerDegree, MembershipStatus,
    AvailabilityStatus, ServiceType,
    Case, CaseStatus, ContactMessage
)

# 🔐 دالة تشفير بيانات الدفع
def encrypt_payment_details(raw: str) -> str:
    key = get_encryption_key()
    f = Fernet(key)
    return f.encrypt(raw.encode()).decode()

class UserCRUD:

    @staticmethod
    def get_user_by_email(session: Session, email: str) -> Optional[User]:
        return session.exec(select(User).where(User.email == email)).first()

    @staticmethod
    def get_user_by_id(session: Session, user_id: str) -> Optional[User]:
        return session.get(User, user_id)

    @staticmethod
    def authenticate_user(session: Session, email: str, password: str) -> Optional[User]:
        user = UserCRUD.get_user_by_email(session, email)
        if user and verify_password(password, user.password_hash):
            return user
        return None

    @staticmethod
    def create_user_with_profile(session: Session, user_data: dict) -> User:
        try:
            # 1. إنشاء المستخدم
            user = User(
                id=str(uuid.uuid4()),
                email=user_data["email"],
                phone=user_data.get("phone", "غير محدد"),
                country=user_data.get("country", "غير محدد"),
                password_hash=get_password_hash(user_data["password"]),
                role=user_data["role"]
            )
            session.add(user)
            session.flush()

            # 2. الملف الشخصي الأساسي
            profile = UserProfile(
                id=str(uuid.uuid4()),
                user_id=user.id,
                full_name=user_data.get("full_name", "غير محدد"),
                national_id=user_data.get("national_id", "غير محدد"),
                date_of_birth=user_data.get("date_of_birth"),
                role=user.role
            )
            session.add(profile)
            session.flush()

            # 3. الملف المتخصص حسب الدور
            specialized_fields = user_data.get("specialized_fields", {})

            if user.role == UserRole.LAWYER:
                lawyer_profile = LawyerProfile(
                    id=str(uuid.uuid4()),
                    profile_id=profile.id,
                    bar_association=specialized_fields.get("bar_association", "غير محدد"),
                    registration_year=specialized_fields.get("year_of_admission", datetime.now().year),
                    degree=specialized_fields.get("degree", LawyerDegree.JUNIOR),
                    specialization=specialized_fields.get("specialization", "غير محدد"),
                    registration_number=specialized_fields.get("registration_number", f"LAW-{uuid.uuid4().hex[:8]}"),
                    country=user_data.get("country", "Egypt"),
                    office_address=specialized_fields.get("office_address", "غير محدد"),
                    latitude=specialized_fields.get("lat"),
                    longitude=specialized_fields.get("lng"),
                    membership_status=specialized_fields.get("membership_status", MembershipStatus.PENDING),
                    availability_status=specialized_fields.get("availability_status", AvailabilityStatus.OFFLINE),
                    rating=specialized_fields.get("rating", 0.0),
                    emergency_available=specialized_fields.get("emergency_available", False)
                )
                session.add(lawyer_profile)
                session.flush()

                for p in specialized_fields.get("payments", []):
                    print("📦 Received payment:", p)
                    print("🔐 Raw details:", p.get("details"))
                    logger.info(f"💳 Adding payment for lawyer: {p}")
                    payment = PaymentInfo(
                        method=p["method"],
                        encrypted_details=encrypt_payment_details(p["details"]),
                        lawyer_id=lawyer_profile.id
                    )
                    session.add(payment)
                    session.flush()

            elif user.role == UserRole.EXPERT:
                expert_profile = ExpertProfile(
                    id=str(uuid.uuid4()),
                    profile_id=profile.id,
                    workplace=specialized_fields.get("workplace", "غير محدد"),
                    service_type=specialized_fields.get("service_type", ServiceType.OTHER),
                    specialization=specialized_fields.get("specialization", "غير محدد"),
                    latitude=specialized_fields.get("lat"),
                    longitude=specialized_fields.get("lng"),
                    availability_status=specialized_fields.get("availability_status", AvailabilityStatus.OFFLINE),
                    rating=specialized_fields.get("rating", 0.0)
                )
                session.add(expert_profile)
                session.flush()

                for p in specialized_fields.get("payments", []):
                    print("📦 Received payment:", p)
                    print("🔐 Raw details:", p.get("details"))
                    logger.info(f"💳 Adding payment for expert: {p}")
                    payment = PaymentInfo(
                        method=p["method"],
                        encrypted_details=encrypt_payment_details(p["details"]),
                        expert_id=expert_profile.id
                     )
                    session.add(payment)
                    session.flush()

            elif user.role == UserRole.JUDGE:
                judge_profile = JudgeProfile(
                    id=str(uuid.uuid4()),
                    profile_id=profile.id,
                    registration_number=specialized_fields.get("registration_number", f"JUD-{uuid.uuid4().hex[:8]}"),
                    degree=specialized_fields.get("degree", "غير محدد"),
                    court=specialized_fields.get("court", "غير محدد"),
                    court_circuit=specialized_fields.get("court_circuit", "غير محدد"),
                    is_active=specialized_fields.get("is_active", True)
                )
                session.add(judge_profile)
                session.flush()

            session.commit()
            session.refresh(user)
            return user

        except Exception as e:
            session.rollback()
            logger.error(f"❌ Error creating user: {str(e)}", exc_info=True)
            raise e

    @staticmethod
    def get_user_profile(session: Session, user_id: str) -> Optional[UserProfile]:
        return session.exec(select(UserProfile).where(UserProfile.user_id == user_id)).first()

    @staticmethod
    def get_lawyer_profile_by_user_id(session: Session, user_id: str) -> Optional[LawyerProfile]:
        """
        ✅ جلب ملف المحامي باستخدام user_id - الإصدار المصحح
        """
        try:
            print(f"🔍 Searching for lawyer profile with user_id: {user_id}")
            
            # ✅ إصلاح: مسح أي session state قديمة
            session.expire_all()
            
            # ✅ إصلاح: التأكد من rollback أي transaction فاشلة
            if session.in_transaction():
                session.rollback()
            
            # ✅ إصلاح: استخدام execution_options لضمان fresh query
            lawyer_profile = session.exec(
                select(LawyerProfile)
                .join(UserProfile)
                .where(UserProfile.user_id == user_id)
                .execution_options(synchronize_session=False)
            ).first()
            
            if lawyer_profile:
                print(f"✅ Found lawyer profile: {lawyer_profile.id}")
                # ✅ إصلاح: refresh الكائن من الداتابيز
                session.refresh(lawyer_profile)
            else:
                print(f"❌ No lawyer profile found for user_id: {user_id}")
                
            return lawyer_profile
            
        except Exception as e:
            logger.error(f"❌ Error getting lawyer profile: {str(e)}", exc_info=True)
            # ✅ إصلاح: rollback صريح
            if session.in_transaction():
                session.rollback()
            return None
    

    @staticmethod
    def get_lawyer_availability(session: Session, user_id: str):
        """إصدار مبسط - بدون تعقيدات"""
        try:
            # query مباشر بدون علاقات معقدة
            user_profile = session.exec(
                select(UserProfile).where(UserProfile.user_id == user_id)
            ).first()
            
            if not user_profile:
                return {"emergency_available": False, "consultations_available": False, "lat": None, "lng": None}
            
            lawyer_profile = session.exec(
                select(LawyerProfile).where(LawyerProfile.profile_id == user_profile.id)
            ).first()
            
            if not lawyer_profile:
                return {"emergency_available": False, "consultations_available": False, "lat": None, "lng": None}
            
            return {
                "emergency_available": lawyer_profile.emergency_available or False,
                "consultations_available": lawyer_profile.availability_status == AvailabilityStatus.AVAILABLE,
                "lat": lawyer_profile.latitude,
                "lng": lawyer_profile.longitude
            }
        except:
            return {"emergency_available": False, "consultations_available": False, "lat": None, "lng": None}

    @staticmethod
    def update_lawyer_availability(
        session: Session, 
        user_id: str, 
        emergency_available: bool,
        availability_status: AvailabilityStatus,
        lat: Optional[float] = None,
        lng: Optional[float] = None
    ) -> Optional[LawyerProfile]:
        """
        ✅ تحديث حالة الاتاحة للمحامي
        """
        try:
            # ✅ إصلاح: مسح الـ cache
            session.expire_all()
            
            # ✅ إصلاح: rollback أي transaction قديمة
            if session.in_transaction():
                session.rollback()
            
            # ✅ بداية transaction جديدة
            session.begin()
            
            # البحث عن lawyer_profile
            lawyer_profile = session.exec(
                select(LawyerProfile)
                .join(UserProfile)
                .where(UserProfile.user_id == user_id)
                .execution_options(synchronize_session=False)
            ).first()
            
            if not lawyer_profile:
                print(f"⚠️ Lawyer profile not found for user {user_id}")
                
                # جلب الـ User و UserProfile أولاً
                user = session.get(User, user_id)
                if not user:
                    raise ValueError(f"User not found: {user_id}")
                    
                user_profile = session.exec(
                    select(UserProfile).where(UserProfile.user_id == user_id)
                ).first()
                
                if not user_profile:
                    raise ValueError(f"User profile not found for user: {user_id}")
                
                # إنشاء lawyer profile افتراضي
                lawyer_profile = LawyerProfile(
                    id=str(uuid.uuid4()),
                    profile_id=user_profile.id,
                    bar_association="غير محدد",
                    registration_year=datetime.now().year,
                    degree=LawyerDegree.JUNIOR,
                    specialization="غير محدد",
                    registration_number=f"LAW-{uuid.uuid4().hex[:8]}",
                    country=user.country,
                    office_address="غير محدد",
                    membership_status=MembershipStatus.ACTIVE,
                    availability_status=availability_status,
                    emergency_available=emergency_available
                )
                session.add(lawyer_profile)
                session.flush()  # ✅ flush بدلاً من commit
            
            # ✅ تحديث البيانات
            lawyer_profile.emergency_available = emergency_available
            lawyer_profile.availability_status = availability_status
            
            if emergency_available and lat is not None and lng is not None:
                lawyer_profile.latitude = lat
                lawyer_profile.longitude = lng
            elif not emergency_available:
                lawyer_profile.latitude = None
                lawyer_profile.longitude = None
            
            # ✅ إضافة updated_at (لو موجود في الموديل)
            if hasattr(lawyer_profile, 'updated_at'):
                lawyer_profile.updated_at = datetime.utcnow()
            
            session.add(lawyer_profile)
            session.commit()
            session.refresh(lawyer_profile)
            
            print(f"✅ Successfully updated - Emergency: {emergency_available}, Status: {availability_status}")
            return lawyer_profile
            
        except Exception as e:
            # ✅ إصلاح: rollback صريح
            if session.in_transaction():
                session.rollback()
            logger.error(f"❌ Error updating lawyer availability: {str(e)}", exc_info=True)
            raise e

    @staticmethod
    def get_pending_registrations(session: Session) -> List:
        pending_users = []

        lawyers = session.exec(
            select(LawyerProfile).where(LawyerProfile.membership_status == MembershipStatus.PENDING)
        ).all()
        pending_users.extend([(lawyer, UserRole.LAWYER) for lawyer in lawyers])

        judges = session.exec(
            select(JudgeProfile).where(JudgeProfile.is_active == False)
        ).all()
        pending_users.extend([(judge, UserRole.JUDGE) for judge in judges])

        experts = session.exec(
            select(ExpertProfile).where(ExpertProfile.availability_status == AvailabilityStatus.OFFLINE)
        ).all()
        pending_users.extend([(expert, UserRole.EXPERT) for expert in experts])

        return pending_users

    @staticmethod
    def approve_user_registration(session: Session, profile_id: str, role: UserRole):
        model_map = {
            UserRole.LAWYER: LawyerProfile,
            UserRole.JUDGE: JudgeProfile,
            UserRole.EXPERT: ExpertProfile
        }
        model = model_map.get(role)
        if not model:
            return None

        profile = session.exec(select(model).where(model.profile_id == profile_id)).first()
        if profile:
            profile.membership_status = MembershipStatus.ACTIVE
            profile.membership_start = datetime.utcnow()
            if role == UserRole.LAWYER:
                profile.membership_end = datetime.utcnow() + timedelta(days=365)
            session.add(profile)
            session.commit()
            session.refresh(profile)
        return profile

    @staticmethod
    def reject_user_registration(session: Session, profile_id: str, role: UserRole):
        model_map = {
            UserRole.LAWYER: LawyerProfile,
            UserRole.JUDGE: JudgeProfile,
            UserRole.EXPERT: ExpertProfile
        }
        model = model_map.get(role)
        if not model:
            return None

        profile = session.exec(select(model).where(model.profile_id == profile_id)).first()
        if profile:
            profile.membership_status = MembershipStatus.REJECTED
            session.add(profile)
            session.commit()
            session.refresh(profile)
        return profile

class CaseCRUD:

    @staticmethod
    def get_cases_by_lawyer(session: Session, lawyer_profile_id: str):
        stmt = select(Case).where(Case.assigned_lawyer_id == lawyer_profile_id)
        return session.exec(stmt).all()

    @staticmethod
    def get_cases_by_judge(session: Session, judge_profile_id: str):
        return []

    @staticmethod
    def get_cases_for_expert(session: Session, expert_profile_id: str):
        return []


class ContactCRUD:
    @staticmethod
    def save_message(session: Session, data: dict) -> ContactMessage:
        message = ContactMessage(
            full_name=data["fullName"],
            email=data["email"],
            phone=data["phone"],
            subject=data["subject"],
            message=data["message"],
            contact_method=data["contactMethod"]
        )
        session.add(message)
        session.commit()
        session.refresh(message)
        return message
    


class ConsultationCRUD:
    
    @staticmethod
    def create_consultation_request(session: Session, user_id: str, request_data: Dict) -> ConsultationRequest:
        """
        إنشاء طلب استشارة جديد
        """
        consultation = ConsultationRequest(
            user_id=user_id,
            lawyer_id=request_data["lawyer_id"],
            subject=request_data["subject"],
            message=request_data["message"],
            country=request_data["country"],
            category=request_data["category"],
            urgency_level=request_data.get("urgency_level", "normal"),
            consultation_fee=request_data.get("consultation_fee", 100),
            duration_minutes=request_data.get("duration_minutes", 30)
        )
        
        session.add(consultation)
        session.commit()
        session.refresh(consultation)
        return consultation
    
    @staticmethod
    def accept_consultation(session: Session, consultation_id: str, lawyer_user_id: str) -> ConsultationRequest:
        """
        قبول طلب الاستشارة
        """
        consultation = session.get(ConsultationRequest, consultation_id)
        if not consultation:
            raise ValueError("طلب الاستشارة غير موجود")
        
        # التحقق من أن المحامي هو صاحب الطلب
        lawyer_profile = UserCRUD.get_lawyer_profile_by_user_id(session, lawyer_user_id)
        if consultation.lawyer_id != lawyer_profile.id:
            raise ValueError("غير مصرح بقبول هذا الطلب")
        
        consultation.status = ConsultationStatus.ACCEPTED
        consultation.responded_at = datetime.utcnow()
        
        session.add(consultation)
        session.commit()
        session.refresh(consultation)
        return consultation
    
    @staticmethod
    def reject_consultation(session: Session, consultation_id: str, lawyer_user_id: str, reason: str) -> ConsultationRequest:
        """
        رفض طلب الاستشارة
        """
        consultation = session.get(ConsultationRequest, consultation_id)
        if not consultation:
            raise ValueError("طلب الاستشارة غير موجود")
        
        # التحقق من أن المحامي هو صاحب الطلب
        lawyer_profile = UserCRUD.get_lawyer_profile_by_user_id(session, lawyer_user_id)
        if consultation.lawyer_id != lawyer_profile.id:
            raise ValueError("غير مصرح برفض هذا الطلب")
        
        consultation.status = ConsultationStatus.REJECTED
        consultation.responded_at = datetime.utcnow()
        consultation.rejection_reason = reason
        
        session.add(consultation)
        session.commit()
        session.refresh(consultation)
        return consultation
    
    @staticmethod
    def confirm_payment(session: Session, consultation_id: str, payment_data: Dict) -> ConsultationRequest:
        """
        تأكيد اكتمال الدفع
        """
        consultation = session.get(ConsultationRequest, consultation_id)
        if not consultation:
            raise ValueError("طلب الاستشارة غير موجود")
        
        consultation.status = ConsultationStatus.PAYMENT_COMPLETED
        consultation.payment_intent_id = payment_data.get("payment_intent_id")
        consultation.payment_status = "completed"
        
        session.add(consultation)
        session.commit()
        session.refresh(consultation)
        return consultation
    
    @staticmethod
    def create_consultation_session(session: Session, consultation_id: str) -> ConsultationSession:
        """
        إنشاء جلسة استشارة جديدة
        """
        consultation_session = ConsultationSession(
            consultation_id=consultation_id,
            scheduled_time=datetime.utcnow() + timedelta(hours=24)  # بعد 24 ساعة
        )
        
        session.add(consultation_session)
        session.commit()
        session.refresh(consultation_session)
        return consultation_session
    
    @staticmethod
    def get_consultation_by_id(session: Session, consultation_id: str) -> Optional[ConsultationRequest]:
        """
        جلب طلب استشارة بواسطة ID
        """
        return session.get(ConsultationRequest, consultation_id)
    
    @staticmethod
    def get_consultation_session(session: Session, consultation_id: str) -> Optional[ConsultationSession]:
        """
        جلب جلسة الاستشارة
        """
        return session.exec(
            select(ConsultationSession).where(ConsultationSession.consultation_id == consultation_id)
        ).first()
    
    # دوال الإشعارات (يمكن تطويرها لاحقاً)
    @staticmethod
    async def notify_user_consultation_accepted(session: Session, consultation: ConsultationRequest):
        print(f"📧 إشعار: تم قبول استشارتك من قبل المحامي {consultation.lawyer.user_profile.full_name}")
    
    @staticmethod
    async def notify_user_consultation_rejected(session: Session, consultation: ConsultationRequest):
        print(f"📧 إشعار: تم رفض استشارتك من قبل المحامي {consultation.lawyer.user_profile.full_name}")
    
    @staticmethod
    async def notify_payment_success(session: Session, consultation: ConsultationRequest):
        print(f"💰 إشعار: تم تأكيد الدفع للاستشارة {consultation.id}")


