import traceback
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

from database.models import InstitutionAdmin
from config.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class CountryInstitutionAuth:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def authenticate_admin(self, country: str, institution_code: str, password: str):
        """مصادقة أدمن المؤسسة"""
        try:
            print(f"🔍 البحث عن المؤسسة: {country}, {institution_code}")
            
            result = await self.db.execute(
                select(InstitutionAdmin).where(
                    InstitutionAdmin.country == country,
                    InstitutionAdmin.institution_code == institution_code,
                    InstitutionAdmin.is_active == True
                )
            )
            admin = result.scalar_one_or_none()
            
            if not admin:
                print("❌ المؤسسة غير موجودة أو غير نشطة")
                raise HTTPException(status_code=401, detail="المؤسسة غير مسجلة")
            
            print(f"🔐 التحقق من كلمة المرور للمؤسسة: {admin.institution_name}")
            print(f"📝 كلمة المرور المدخلة: {password}")
            print(f"📝 كلمة المرور المخزنة: {admin.password_hash}")
            
            # 🔥 تحقق من نوع الباسوورد
            if admin.password_hash.startswith("$2b$"):
                # إذا الباسوورد مشفر
                is_valid = pwd_context.verify(password, admin.password_hash)
                print(f"🔐 التحقق من باسوورد مشفر: {is_valid}")
            else:
                # إذا الباسوورد نص عادي
                is_valid = (password == admin.password_hash)
                print(f"🔐 التحقق من باسوورد عادي: {is_valid}")
            
            if not is_valid:
                print("❌ كلمة المرور غير صحيحة")
                raise HTTPException(status_code=401, detail="كلمة المرور غير صحيحة")
            
            print(f"✅ تمت المصادقة بنجاح لـ: {admin.institution_name}")
            return admin
            
        except HTTPException as he:
            print(f"🚫 HTTPException: {he.detail}")
            raise he
        except Exception as e:
            print(f"❌ خطأ غير متوقع في المصادقة: {str(e)}")
            print(f"📋 تفاصيل الخطأ الكاملة: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"خطأ في المصادقة: {str(e)}")
    
    def create_access_token(self, data: dict):
        """إنشاء JWT token"""
        try:
            to_encode = data.copy()
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            to_encode.update({"exp": expire})
            
            print(f"🔐 إنشاء توكين بالبيانات: {to_encode}")
            
            encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
            
            print(f"✅ تم إنشاء التوكين بنجاح: {encoded_jwt[:50]}...")
            return encoded_jwt
            
        except Exception as e:
            print(f"❌ خطأ في إنشاء التوكين: {str(e)}")
            raise HTTPException(status_code=500, detail=f"خطأ في إنشاء التوكين: {str(e)}")