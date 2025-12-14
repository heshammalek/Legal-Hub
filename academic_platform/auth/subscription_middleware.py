# auth/subscription_middleware.py
from fastapi import Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
import re

from database.connection import get_db
from database.models import InstitutionAdmin

async def check_subscription_middleware(request: Request, call_next):
    try:
        # 📍 Routes العامة المسموح لها بدون تحقق
        public_paths = [
            "/",
            "/health", 
            "/docs",
            "/redoc",
            "/api/auth/",
            "/api/experience/",
            "/home"
        ]
        
        current_path = request.url.path
        if any(current_path.startswith(path) for path in public_paths):
            return await call_next(request)
        
        institution_code = request.headers.get("institution-code")
        
        if not institution_code:
            return await call_next(request)
        
        async for db in get_db():
            result = await db.execute(
                select(InstitutionAdmin).where(
                    InstitutionAdmin.institution_code == institution_code
                )
            )
            institution = result.scalar_one_or_none()
            
            if not institution:
                return await call_next(request)
            
            if not institution.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="اشتراك المؤسسة منتهي أو معطل"
                )
            
            if institution.subscription_end and institution.subscription_end < datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="فترة اشتراك المؤسسة انتهت"
                )
                
    except HTTPException:
        raise
    except Exception as e:
        # إذا حدث أي خطأ، اترك الطلب يكمل
        print(f"⚠️ خطأ في الميدلوير (تم تخطيه): {e}")
        return await call_next(request)
    
    return await call_next(request)