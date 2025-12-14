# auth/teacher_permissions.py
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import secrets
from sqlalchemy import and_
from pydantic import BaseModel
from database.connection import get_db
from database.models import LegalCase, StudyGroup, Teacher, InstitutionAdmin

# 🔐 إعدادات JWT
SECRET_KEY = secrets.token_urlsafe(32)  # مفتاح سري آمن
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 24 * 60  # 24 ساعة

# 📝 نماذج البيانات للتوثيق
class TokenData(BaseModel):
    teacher_id: Optional[int] = None
    admin_id: Optional[int] = None
    user_type: str  # teacher أو admin

class TeacherLogin(BaseModel):
    email: str
    institution_code: str
    password: str

class TeacherCreate(BaseModel):
    name: str
    email: str
    specialization: str
    country: str = "SA"
    institution_code: str
    admin_id: int
    password: str

# 🔑 دوال إنشاء وتحقق التوكن
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """إنشاء JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_token(token: str, db: AsyncSession) -> TokenData:
    """التحقق من صحة التوكن واستخراج البيانات"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        teacher_id: int = payload.get("teacher_id")
        admin_id: int = payload.get("admin_id")
        user_type: str = payload.get("user_type")
        
        if teacher_id is None and admin_id is None:
            raise credentials_exception
        
        token_data = TokenData(
            teacher_id=teacher_id,
            admin_id=admin_id,
            user_type=user_type
        )
    except JWTError:
        raise credentials_exception
    
    return token_data

# 👨‍🏫 دوال المصادقة للمدرسين
async def get_current_teacher(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
) -> Teacher:
    """الحصول على بيانات المدرس الحالي من التوكن"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="مطلوب توكن مصادقة",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    token_data = await verify_token(token, db)
    
    if token_data.user_type != "teacher" or not token_data.teacher_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="التوكن غير صالح للمدرس"
        )
    
    # جلب بيانات المدرس من الداتابيز
    result = await db.execute(
        select(Teacher).where(
            and_(
                Teacher.id == token_data.teacher_id,
                Teacher.is_active == True
            )
        )
    )
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="المدرس غير موجود أو غير نشط"
        )
    
    return teacher

async def get_current_active_teacher(
    current_teacher: Teacher = Depends(get_current_teacher)
) -> Teacher:
    """التأكد من أن المدرس نشط"""
    if not current_teacher.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الحساب معطل"
        )
    return current_teacher

# 👨‍💼 دوال المصادقة لمديري النظام
async def get_current_admin(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
) -> InstitutionAdmin:
    """الحصول على بيانات مدير النظام الحالي من التوكن"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="مطلوب توكن مصادقة",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    token_data = await verify_token(token, db)
    
    if token_data.user_type != "admin" or not token_data.admin_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="التوكن غير صالح لمدير النظام"
        )
    
    # جلب بيانات مدير النظام من الداتابيز
    result = await db.execute(
        select(InstitutionAdmin).where(
            and_(
                InstitutionAdmin.id == token_data.admin_id,
                InstitutionAdmin.is_active == True
            )
        )
    )
    admin = result.scalar_one_or_none()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="مدير النظام غير موجود أو غير نشط"
        )
    
    return admin

async def get_current_active_admin(
    current_admin: InstitutionAdmin = Depends(get_current_admin)
) -> InstitutionAdmin:
    """التأكد من أن مدير النظام نشط"""
    if not current_admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="حساب مدير النظام معطل"
        )
    return current_admin

# 🔐 دوال تسجيل الدخول
async def authenticate_teacher(
    email: str, 
    institution_code: str, 
    password: str, 
    db: AsyncSession
) -> Optional[Teacher]:
    """مصادقة بيانات المدرس"""
    result = await db.execute(
        select(Teacher).where(
            and_(
                Teacher.email == email,
                Teacher.institution_code == institution_code.upper(),
                Teacher.is_active == True
            )
        )
    )
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        return None
    
    # في الواقع هنا بيكون فيه كود للتحقق من كلمة المرور المشفرة
    # لكن مؤقتاً بنفترض أن كلمة المرور صحيحة
    if teacher.password != password:  # هذا مؤقت - يجب استخدام hashing
        return None
    
    return teacher

async def login_teacher(
    login_data: TeacherLogin,
    db: AsyncSession = Depends(get_db)
):
    """تسجيل دخول المدرس وإرجاع التوكن"""
    teacher = await authenticate_teacher(
        login_data.email, 
        login_data.institution_code, 
        login_data.password, 
        db
    )
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="البريد الإلكتروني أو كلمة المرور غير صحيحة"
        )
    
    # إنشاء توكن الوصول
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "teacher_id": teacher.id,
            "user_type": "teacher",
            "email": teacher.email,
            "institution_code": teacher.institution_code
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "teacher_id": teacher.id,
        "name": teacher.name,
        "email": teacher.email,
        "institution_code": teacher.institution_code
    }

async def login_admin(
    login_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """تسجيل دخول مدير النظام وإرجاع التوكن"""
    # هذا مثال مبسط - يحتاج تطوير حسب نظام مديري النظام لديك
    result = await db.execute(
        select(InstitutionAdmin).where(
            and_(
                InstitutionAdmin.institution_code == login_data.get('institution_code'),
                InstitutionAdmin.country == login_data.get('country'),
                InstitutionAdmin.is_active == True
            )
        )
    )
    admin = result.scalar_one_or_none()
    
    if not admin or admin.password != login_data.get('password'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="بيانات الدخول غير صحيحة"
        )
    
    # إنشاء توكن الوصول
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "admin_id": admin.id,
            "user_type": "admin",
            "institution_code": admin.institution_code,
            "country": admin.country
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin_id": admin.id,
        "name": admin.name,
        "institution_code": admin.institution_code,
        "country": admin.country
    }

# 🛡️ دوال التحقق من الصلاحيات
async def verify_teacher_owns_group(
    teacher: Teacher = Depends(get_current_teacher),
    group_id: int = None,
    db: AsyncSession = Depends(get_db)
) -> bool:
    """التحقق من أن المدرس يمتلك المجموعة"""
    if not group_id:
        return True
    
    result = await db.execute(
        select(StudyGroup).where(
            and_(
                StudyGroup.id == group_id,
                StudyGroup.teacher_id == teacher.id
            )
        )
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="لا تملك صلاحية الوصول لهذه المجموعة"
        )
    
    return True

async def verify_teacher_owns_case(
    teacher: Teacher = Depends(get_current_teacher),
    case_id: int = None,
    db: AsyncSession = Depends(get_db)
) -> bool:
    """التحقق من أن المدرس يمتلك القضية"""
    if not case_id:
        return True
    
    result = await db.execute(
        select(LegalCase).where(
            and_(
                LegalCase.id == case_id,
                LegalCase.teacher_id == teacher.id
            )
        )
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="لا تملك صلاحية الوصول لهذه القضية"
        )
    
    return True

async def verify_admin_owns_teacher(
    admin: InstitutionAdmin = Depends(get_current_admin),
    teacher_id: int = None,
    db: AsyncSession = Depends(get_db)
) -> bool:
    """التحقق من أن المدير يمتلك المدرس (في مؤسسته)"""
    if not teacher_id:
        return True
    
    result = await db.execute(
        select(Teacher).where(
            and_(
                Teacher.id == teacher_id,
                Teacher.admin_id == admin.id
            )
        )
    )
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="لا تملك صلاحية الوصول لهذا المدرس"
        )
    
    return True

# 🔄 دوال مساعدة للتوكن
def get_token_from_header(authorization: str = Header(...)) -> str:
    """استخراج التوكن من header"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="مطلوب توكن مصادقة"
        )
    return authorization.replace("Bearer ", "")

async def refresh_token(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """تجديد التوكن"""
    token = get_token_from_header(authorization)
    token_data = await verify_token(token, db)
    
    # إنشاء توكن جديد بنفس البيانات
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_access_token = create_access_token(
        data={
            "teacher_id": token_data.teacher_id,
            "admin_id": token_data.admin_id,
            "user_type": token_data.user_type
        },
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

# 📊 دوال التحقق من الحالة
async def check_teacher_permissions(
    teacher: Teacher = Depends(get_current_active_teacher),
    required_permission: str = None
) -> Teacher:
    """التحقق من صلاحيات المدرس الإضافية"""
    # هنا يمكن إضافة تحقق من صلاحيات محددة
    # مثل: can_create_cases, can_manage_groups, etc.
    
    if required_permission == "create_cases" and not teacher.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مسموح بإنشاء قضايا جديدة"
        )
    
    return teacher

# 🎯 Router للمصادقة
from fastapi import APIRouter

auth_router = APIRouter()

@auth_router.post("/teacher-login")
async def teacher_login_endpoint(
    login_data: TeacherLogin,
    db: AsyncSession = Depends(get_db)
):
    """Endpoint لتسجيل دخول المدرس"""
    return await login_teacher(login_data, db)

@auth_router.post("/admin-login")
async def admin_login_endpoint(
    login_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Endpoint لتسجيل دخول مدير النظام"""
    return await login_admin(login_data, db)

@auth_router.post("/refresh-token")
async def refresh_token_endpoint(
    authorization: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Endpoint لتجديد التوكن"""
    return await refresh_token(authorization, db)

@auth_router.get("/verify-token")
async def verify_token_endpoint(
    teacher: Teacher = Depends(get_current_teacher)
):
    """Endpoint للتحقق من صحة التوكن"""
    return {
        "valid": True,
        "teacher_id": teacher.id,
        "name": teacher.name,
        "email": teacher.email,
        "institution_code": teacher.institution_code
    }

# 💡 مثال على استخدام الصلاحيات في ال endpoints
"""
from auth.teacher_permissions import (
    get_current_teacher, 
    get_current_active_teacher,
    verify_teacher_owns_group,
    verify_teacher_owns_case
)

@router.post("/cases")
async def create_case(
    case_data: CaseCreate,
    teacher: Teacher = Depends(get_current_active_teacher),
    _: bool = Depends(verify_teacher_owns_group)
):
    # فقط المدرس النشط الذي يمتلك المجموعة يمكنه إنشاء قضية
    pass

@router.put("/cases/{case_id}")
async def update_case(
    case_id: int,
    case_data: CaseUpdate,
    teacher: Teacher = Depends(get_current_active_teacher),
    _: bool = Depends(lambda: verify_teacher_owns_case(case_id=case_id))
):
    # فقط المدرس النشط الذي يمتلك القضية يمكنه تعديلها
    pass
"""