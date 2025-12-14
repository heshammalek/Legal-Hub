from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlmodel import Session, select
from typing import List
from app.database.connection import get_session
from app.database.subscription_crud import SubscriptionCRUD
from app.core.security import get_current_active_user
from app.models.user_models import LawyerProfile, User, UserProfile
from app.schemas.subscription_schemas import (
    MembershipPlanResponse,
    UserSubscriptionResponse,
    InvoiceResponse,
    UserSubscriptionCreate,
    ChangePasswordRequest,
    LawyerProfileUpdate,
    LawyerSettingsResponse,
    CurrentUserInfo
)
from app.utils.otp_service import otp_service
from app.utils.email import send_password_change_success, send_security_alert
from app.core.password_utils import verify_password, get_password_hash

router = APIRouter()

# 🔹 الحصول على بيانات المستخدم الحالي (للعرض فقط)
@router.get("/current-user", response_model=CurrentUserInfo)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """الحصول على بيانات المستخدم الحالي للعرض فقط"""
    from app.database.crud import UserCRUD
    
    user_profile = UserCRUD.get_user_profile(session, current_user.id)
    subscription_crud = SubscriptionCRUD(session)
    subscription = subscription_crud.get_user_subscription(current_user.id)
    
    return CurrentUserInfo(
        full_name=user_profile.full_name if user_profile else current_user.email,
        email=current_user.email,
        phone=current_user.phone or "غير مضبوط",
        current_plan=subscription.plan_name if subscription else "لا يوجد اشتراك",
        plan_status=subscription.status if subscription else "غير مشترك"
    )

# 🔹 تغيير كلمة المرور (بعد التحقق من القديمة)
@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """تغيير كلمة المرور بعد التحقق من صحة القديمة"""
    from app.database.crud import UserCRUD
    
    print(f"🎯 CHANGE PASSWORD REQUEST for: {current_user.email}")

    # 1. التحقق من كلمة المرور القديمة
    if not verify_password(password_data.old_password, current_user.password_hash):
        print(f"❌ OLD PASSWORD VERIFICATION FAILED")
        
        # إرسال تنبيه أمني
        user_profile = UserCRUD.get_user_profile(session, current_user.id)
        background_tasks.add_task(
            send_security_alert,
            current_user.email,
            user_profile.full_name if user_profile else current_user.email,
            "محاولة تغيير كلمة مرور فاشلة"
        )
        
        # تسجيل الخروج الإجباري
        # يمكنك إضافة منطق تسجيل الخروج هنا
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="كلمة المرور القديمة غير صحيحة - تم إرسال تنبيه أمني"
        )

    # 2. التحقق من تطابق كلمات المرور الجديدة
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="كلمات المرور الجديدة غير متطابقة"
        )

    # 3. التحقق من أن كلمة المرور الجديدة مختلفة عن القديمة
    if verify_password(password_data.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة"
        )

    try:
        # 4. تحديث كلمة المرور
        current_user.password_hash = get_password_hash(password_data.new_password)
        session.add(current_user)
        session.commit()
        
        print(f"✅ PASSWORD UPDATED SUCCESSFULLY for {current_user.email}")
        
        # 5. إرسال إشعار النجاح
        user_profile = UserCRUD.get_user_profile(session, current_user.id)
        background_tasks.add_task(
            send_password_change_success,
            current_user.email,
            user_profile.full_name if user_profile else current_user.email
        )
        
        return {
            "message": "تم تغيير كلمة المرور بنجاح",
            "security_notice": "تم إرسال تأكيد إلى بريدك الإلكتروني"
        }
        
    except Exception as e:
        session.rollback()
        print(f"❌ ERROR UPDATING PASSWORD: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="حدث خطأ في تغيير كلمة المرور"
        )

# 🔹 باقي ال endpoints كما هي مع تحسينات
@router.get("/plans", response_model=List[MembershipPlanResponse])
async def get_membership_plans(session: Session = Depends(get_session)):
    crud = SubscriptionCRUD(session)
    return crud.get_all_plans()

@router.get("/lawyer/settings", response_model=LawyerSettingsResponse)
async def get_lawyer_settings(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """الحصول على إعدادات المحامي مع الباقة الحالية - الإصدار المصحح"""
    from app.database.crud import UserCRUD
    
    crud = SubscriptionCRUD(session)
    
    # ✅ الإصلاح: استخدام query مباشر بدلاً من الدالة المعطلة
    user_profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    ).first()
    
    if not user_profile:
        raise HTTPException(status_code=404, detail="لم يتم العثور على الملف الشخصي")
    
    lawyer_profile = session.exec(
        select(LawyerProfile).where(LawyerProfile.profile_id == user_profile.id)
    ).first()
    
    if not lawyer_profile:
        raise HTTPException(status_code=404, detail="لم يتم العثور على ملف المحامي")
    
    subscription = crud.get_user_subscription(current_user.id)
    invoices = crud.get_user_invoices(current_user.id)
    
    return LawyerSettingsResponse(
        profile={
            "full_name": user_profile.full_name,  # ✅ الإصلاح: استخدام user_profile مباشرة
            "email": current_user.email,
            "phone": current_user.phone,
            "specialization": lawyer_profile.specialization,
            "bar_association": lawyer_profile.bar_association,
            "registration_number": lawyer_profile.registration_number,
            "office_address": lawyer_profile.office_address,
            "bio": lawyer_profile.bio if hasattr(lawyer_profile, 'bio') and lawyer_profile.bio else ""
        },
        subscription=subscription,
        invoices=invoices,
        current_plan=subscription.plan_name if subscription else "لا يوجد اشتراك"
    )



# 🔹 تغيير كلمة المرور باستخدام OTP
@router.post("/change-password-with-otp")
async def change_password_with_otp(
    password_data: dict,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """تغيير كلمة المرور باستخدام OTP للتحقق"""
    from app.database.crud import UserCRUD
    from app.utils.email import send_password_change_success
    
    email = password_data.get("email")
    otp = password_data.get("otp")
    new_password = password_data.get("new_password")
    confirm_password = password_data.get("confirm_password")
    
    if not all([email, otp, new_password, confirm_password]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="جميع الحقول مطلوبة"
        )
    
    # التحقق من تطابق كلمات المرور
    if new_password != confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="كلمات المرور الجديدة غير متطابقة"
        )
    
    # التحقق من قوة كلمة المرور
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="كلمة المرور يجب أن تكون 6 أحرف على الأقل"
        )
    
    # التحقق من صحة OTP
    otp_result = otp_service.verify_otp(email, "password_change", otp)
    if not otp_result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز التحقق غير صحيح أو منتهي الصلاحية"
        )
    
    user_id = otp_result.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="بيانات التحقق غير صالحة"
        )
    
    # البحث عن المستخدم
    user = UserCRUD.get_user_by_id(session, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المستخدم غير موجود"
        )
    
    # التحقق من أن كلمة المرور الجديدة مختلفة عن القديمة
    if verify_password(new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة"
        )
    
    try:
        # تغيير كلمة المرور
        user.password_hash = get_password_hash(new_password)
        session.add(user)
        session.commit()
        
        print(f"✅ PASSWORD CHANGED SUCCESSFULLY via OTP for {email}")
        
        # إرسال إشعار النجاح
        user_profile = UserCRUD.get_user_profile(session, user.id)
        background_tasks.add_task(
            send_password_change_success,
            user.email,
            user_profile.full_name if user_profile else user.email
        )
        
        return {
            "message": "تم تغيير كلمة المرور بنجاح",
            "security_notice": "تم إرسال تأكيد إلى بريدك الإلكتروني"
        }
        
    except Exception as e:
        session.rollback()
        print(f"❌ ERROR CHANGING PASSWORD VIA OTP: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="حدث خطأ في تغيير كلمة المرور"
        )