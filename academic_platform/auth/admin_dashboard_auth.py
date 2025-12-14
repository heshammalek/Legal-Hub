from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import traceback

from database.connection import get_db
from auth.country_institution_auth import CountryInstitutionAuth

router = APIRouter()

class LoginRequest(BaseModel):
    country: str
    institution_code: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_data: dict

@router.post("/login", response_model=LoginResponse)
async def institution_login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        print(f"🔐 بدء تسجيل الدخول: {login_data.country}, {login_data.institution_code}")
        
        # تحقق من البيانات الأساسية
        if not login_data.country or not login_data.institution_code or not login_data.password:
            raise HTTPException(status_code=400, detail="جميع الحقول مطلوبة")
        
        auth = CountryInstitutionAuth(db)
        admin = await auth.authenticate_admin(
            login_data.country.upper(),
            login_data.institution_code.upper(),
            login_data.password
        )
        
        print(f"✅ تمت المصادقة بنجاح: {admin.institution_name}")  # ⚠️ غير هنا
        
        # 🔥 إصلاح بيانات التوكين
        token_data = {
            "sub": f"admin_{admin.id}",
            "admin_id": admin.id,
            "country": admin.country,
            "institution_code": admin.institution_code,
            "user_type": "admin"
        }
        
        access_token = auth.create_access_token(token_data)
        
        # 🔥 إصلاح البيانات المرجعة - استخدم institution_name بدل name
        admin_response_data = {
            "name": admin.institution_name,  # ⚠️ غير هنا - استخدم institution_name
            "country": admin.country,
            "institution_code": admin.institution_code,
            "admin_id": admin.id
        }
        
        print(f"🎫 إنشاء توكين لـ: {admin_response_data}")
        
        return LoginResponse(
            access_token=access_token,
            admin_data=admin_response_data
        )
        
    except HTTPException as he:
        print(f"🚫 HTTPException في login: {he.detail}")
        raise he
    except Exception as e:
        print(f"❌ خطأ غير متوقع في login: {str(e)}")
        print(f"📋 تفاصيل الخطأ الكاملة: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"خطأ في الخادم: {str(e)}")