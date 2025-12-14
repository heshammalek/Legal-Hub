from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional
from .config import settings
from app.core.password_utils import verify_password, get_password_hash
from fastapi import Depends, HTTPException, status, Request, Cookie
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session
from app.database.connection import get_session
from app.database.crud import UserCRUD
from app.models.token_models import TokenData
from app.models.user_models import UserRole, User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """تحقق من تطابق كلمة المرور"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """إنشاء hash لكلمة المرور"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """إنشاء JWT token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """تحقق من صحة JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user_from_cookie(
    request: Request,
    session: Session = Depends(get_session)
) -> User:
    """استخراج المستخدم الحالي من الكوكيز - الدالة الأساسية"""
    
    # محاولة استخراج التوكن من cookies
    access_token = request.cookies.get("access_token")
    
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="لم يتم العثور على توكن المصادقة في الكوكيز",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verify_token(access_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توكن غير صالح أو منتهي",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = payload.get("user_id")
        if not user_id:
            raise ValueError("لم يتم العثور على معرف المستخدم في التوكن")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="تعذر تحليل بيانات التوكن",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # محاولة تحويل user_id إلى int إذا كان string
    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        # إذا فشل التحويل، استخدم القيمة كما هي (ربما UUID)
        user_id_int = user_id

    user = UserCRUD.get_user_by_id(session, user_id_int)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="المستخدم غير موجود",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="الحساب غير مفعل",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# دالة للحصول على المستخدم النشط - الاسم الصحيح والوحيد
def get_current_active_user(
    request: Request,
    session: Session = Depends(get_session)
) -> User:
    """Get current active user from cookie"""
    return get_current_user_from_cookie(request, session)

# دالة للتحقق من الدور
def require_role(required_role: UserRole):
    """تتطلب دور محدد للوصول"""
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"الصلاحية المطلوبة: {required_role.value}, لديك: {current_user.role.value}"
            )
        return current_user
    return role_checker

# دالة للتحقق من عدة أدوار
def require_roles(*allowed_roles: UserRole):
    """تتطلب أحد الأدوار المحددة للوصول"""
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            allowed_roles_str = ", ".join([role.value for role in allowed_roles])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"الصلاحيات المسموحة: {allowed_roles_str}, لديك: {current_user.role.value}"
            )
        return current_user
    return role_checker


