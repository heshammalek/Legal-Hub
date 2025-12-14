from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database.connection import get_db
from database.models import InstitutionAdmin
from config.settings import settings

security = HTTPBearer()

async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        admin_id = payload.get("admin_id")
        
        if not admin_id:
            raise HTTPException(status_code=401, detail="التوكين غير صالح")
        
        result = await db.execute(
            select(InstitutionAdmin).where(
                InstitutionAdmin.id == admin_id,
                InstitutionAdmin.is_active == True
            )
        )
        admin = result.scalar_one_or_none()
        
        if not admin:
            raise HTTPException(status_code=401, detail="المؤسسة غير موجودة")
        
        return admin
        
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"خطأ في التوكين: {str(e)}")