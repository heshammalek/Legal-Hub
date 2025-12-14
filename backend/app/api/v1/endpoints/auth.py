from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status, Response
from sqlmodel import Session
from datetime import datetime, timedelta
import logging

# Assuming these modules exist from your project structure
from app.database.connection import get_session
from app.database.crud import UserCRUD
from app.core.security import create_access_token
from app.core.password_utils import verify_password
from app.core.config import settings
from app.models.user_models import UserRole 
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.utils.email import send_password_reset_otp
from app.utils.otp_service import otp_service

# Setup logger
logger = logging.getLogger(__name__)

# ===================================================================================
# Pydantic Models for Request and Response
# ===================================================================================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    user_type: str # 'user', 'lawyer', 'judge', 'expert'
    
    # Common optional fields
    phone: Optional[str] = None
    country: Optional[str] = None
    national_id: Optional[str] = None
    
    class Config:
        extra = 'allow' # Allows extra fields for different user types

class LoginResponse(BaseModel):
    message: str
    access_token: str
    user_type: str
    user_id: str
    redirect_url: str

class MessageResponse(BaseModel):
    message: str

# ===================================================================================
# Router
# ===================================================================================
router = APIRouter(
    prefix="/auth", # Using a common prefix for auth routes
    tags=["Authentication"]
)

# ===================================================================================
# Helper Function to set the token cookie
# ===================================================================================
def _set_auth_cookie(response: Response, user_email: str, user_id: int, user_role: str):
    """Creates a JWT and sets it in a secure HttpOnly cookie."""
    expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_email, "user_id": str(user_id), "user_type": user_role},
        expires_delta=expires
    )
    
    # تأكد من أن الكوكيز تُرسل بشكل صحيح
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,       # لضمان الأمان HTTPOnly
        samesite="lax",      # يسمح بإرسال الكوكي في التنقلات - "lax" أفضل من "none" محلياً
        secure=False,        # محلياً HTTP؛ في الإنتاج اجعله True
        domain="localhost",   # صريح لتغطي كلا المنفذين
        max_age=int(expires.total_seconds()),
        path="/",
    )

    # إضافة logging للتشخيص
    logger.info(f"🍪 Setting cookie for user: {user_email}")
    logger.info(f"🍪 Token length: {len(access_token)}")
    logger.info(f"🍪 Cookie will expire in: {expires.total_seconds()} seconds")
    
    return access_token

def _get_redirect_url(user_role: str) -> str:
    """تحديد رابط التوجيه حسب نوع المستخدم"""
    role_redirects = {
        "user": "/dashboards/user",
        "lawyer": "/dashboards/lawyer", 
        "judge": "/dashboards/judge",
        "expert": "/dashboards/expert",
        "admin": "/dashboards/admin"
    }
    return role_redirects.get(user_role.lower(), "/dashboards/user")

# ===================================================================================
# Login Endpoint
# ===================================================================================
@router.post("/login", response_model=LoginResponse)
async def login(response: Response, login_data: LoginRequest, session: Session = Depends(get_session)):
    """Handles user login, and on success, sets a secure HttpOnly auth cookie."""
    try:
        user = UserCRUD.authenticate_user(session, login_data.email, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="البريد الإلكتروني أو كلمة المرور غير صحيحة"
            )
        
        # إنشاء التوكن وضبط الكوكي
        access_token = _set_auth_cookie(response, user.email, user.id, user.role.value)
        redirect_url = _get_redirect_url(user.role.value)
        
        logger.info(f"User {user.email} logged in successfully, redirecting to {redirect_url}")
        
        return LoginResponse(
            message="تم تسجيل الدخول بنجاح",
            access_token=access_token,
            user_type=user.role.value,
            user_id=str(user.id),
            redirect_url=redirect_url
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="حدث خطأ داخلي في الخادم"
        )

# ===================================================================================
# Signup Endpoint
# ===================================================================================
@router.post("/signup", response_model=LoginResponse)
async def signup(response: Response, signup_data: SignupRequest, session: Session = Depends(get_session)):
    """Handles new user registration, and on success, logs them in by setting the auth cookie."""
    try:
        if UserCRUD.get_user_by_email(session, signup_data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="البريد الإلكتروني هذا مسجل مسبقاً"
            )
        
        # Convert user_type string to UserRole enum
        try:
            role_enum = UserRole(signup_data.user_type.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"نوع المستخدم '{signup_data.user_type}' غير صالح."
            )

        # Create user (assuming a function similar to your first example)
        # Note: You need a CRUD function that takes the validated data and creates the user
        user_data = signup_data.model_dump()
        user_data["role"] = role_enum
        user = UserCRUD.create_user_with_profile(session, user_data)


        # Log the new user in immediately by setting the cookie
        access_token = _set_auth_cookie(response, user.email, user.id, user.role.value)
        redirect_url = _get_redirect_url(user.role.value)
        
        logger.info(f"User {user.email} signed up and logged in successfully, redirecting to {redirect_url}")
        
        return LoginResponse(
            message="تم إنشاء الحساب وتسجيل الدخول بنجاح",
            access_token=access_token,
            user_type=user.role.value,
            user_id=str(user.id),
            redirect_url=redirect_url
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="حدث خطأ أثناء إنشاء الحساب"
        )

# ===================================================================================
# Logout Endpoint
# ===================================================================================
@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """Logs out the user by clearing the auth cookie."""
    response.delete_cookie(
        key="access_token",
        path="/",
        domain="localhost"
    )
    logger.info("User logged out successfully")
    return {"message": "تم تسجيل الخروج بنجاح"}

# ===================================================================================
# Check Auth Status Endpoint
# ===================================================================================
@router.get("/me")
async def get_current_user_info(
    request: Request,
    session: Session = Depends(get_session)
):
    """Get current user information from cookie"""
    from app.core.security import get_current_active_user
    from app.database.crud import UserCRUD
    
    try:
        current_user = get_current_active_user(request, session)
        
        # ✅ البحث عن lawyer_id للمحامين
        lawyer_id = None
        if current_user.role.value == "lawyer":
            lawyer_profile = UserCRUD.get_lawyer_profile_by_user_id(session, current_user.id)
            if lawyer_profile:
                lawyer_id = lawyer_profile.id
                print(f"✅ Found lawyer_id: {lawyer_id} for user: {current_user.id}")
            else:
                print(f"⚠️ No lawyer profile found for user: {current_user.id}")
        
        response_data = {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role.value,
            "is_active": current_user.is_active,
            "redirect_url": _get_redirect_url(current_user.role.value),
            "lawyer_id": lawyer_id  # ✅ هذا هو الحقل المطلوب
        }
        
        print(f"📤 Sending response: {response_data}")
        return response_data
        
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="غير مُصرح"
        )
    



# ===================================================================================
# Verify Current Password Endpoint للاستعمال في نافذة الضبط 
# ===================================================================================
class VerifyPasswordRequest(BaseModel):
    current_password: str

@router.post("/verify-password")
async def verify_current_password(
    verify_data: VerifyPasswordRequest,
    request: Request,
    session: Session = Depends(get_session)
):
    """التحقق من كلمة المرور الحالية"""
    from app.core.security import get_current_active_user
    
    try:
        # الحصول على المستخدم الحالي
        current_user = get_current_active_user(request, session)
        
        # التحقق من كلمة المرور الحالية
        if not verify_password(verify_data.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="كلمة المرور الحالية غير صحيحة"
            )
        
        return {"message": "كلمة المرور الحالية صحيحة"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password verification error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="حدث خطأ أثناء التحقق من كلمة المرور"
        )
    

# ===================================================================================
# Change Password Endpoint
# ===================================================================================
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(
    change_data: ChangePasswordRequest,
    request: Request,
    session: Session = Depends(get_session)
):
    """تغيير كلمة المرور"""
    from app.core.security import get_current_active_user
    from app.core.password_utils import get_password_hash
    
    try:
        # الحصول على المستخدم الحالي
        current_user = get_current_active_user(request, session)
        
        # التحقق من كلمة المرور الحالية
        if not verify_password(change_data.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="كلمة المرور الحالية غير صحيحة"
            )
        
        # تغيير كلمة المرور
        current_user.password_hash = get_password_hash(change_data.new_password)
        session.add(current_user)
        session.commit()
        
        return {"message": "تم تغيير كلمة المرور بنجاح"}
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Password change error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="حدث خطأ أثناء تغيير كلمة المرور"
        )
    



    
# 🔹 طلب تغيير كلمة المرور عبر OTP
@router.post("/request-password-change")
async def request_password_change(
    request_data: dict,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session)
):
    """طلب تغيير كلمة المرور عبر إرسال OTP إلى البريد الإلكتروني"""
    try:
        from app.database.crud import UserCRUD
        
        email = request_data.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="البريد الإلكتروني مطلوب"
            )
        
        # البحث عن المستخدم بالبريد الإلكتروني
        user = UserCRUD.get_user_by_email(session, email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="البريد الإلكتروني غير مسجل في النظام"
            )
        
        # توليد وتخزين OTP
        otp_code = otp_service.generate_otp()
        otp_data = {
            "user_id": user.id,
            "email": user.email,
            "action": "password_change",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # تخزين OTP
        stored_otp = otp_service.store_otp_request(
            user_id=user.id,
            email=user.email,
            action="password_change",
            data=otp_data
        )
        
        print(f"📧 Sending OTP {otp_code} to {email}")
        
        # إرسال OTP عبر البريد (استخدم الدالة الصحيحة)
        user_profile = UserCRUD.get_user_profile(session, user.id)
        full_name = user_profile.full_name if user_profile else user.email
        
        # استخدم الدالة الصحيحة
        background_tasks.add_task(
            send_password_reset_otp,
            user.email,
            full_name,
            otp_code
        )
        
        print(f"🎯 OTP FOR {email}: {otp_code}")
        print(f"👤 User: {full_name}")
        print(f"⏰ OTP valid for 10 minutes")
        
        return {
            "message": "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
            "otp_debug": otp_code,  # فقط للاختبار
            "notice": "الرمز صالح لمدة 10 دقائق"
        }
        
    except Exception as e:
        print(f"❌ ERROR in request_password_change: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="حدث خطأ في إرسال رمز التحقق"
        )