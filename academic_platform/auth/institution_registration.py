# auth/institution_registration.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from database.connection import get_db
from database.models import InstitutionAdmin

router = APIRouter()

class InstitutionRegistration(BaseModel):
    name: str
    email: str
    country: str
    institution_code: str
    phone: Optional[str] = None
    subscription_months: int = 3  # 3 أشهر تجريبية

@router.post("/register-institution", status_code=status.HTTP_201_CREATED)
async def register_institution(
    registration_data: InstitutionRegistration,
    db: AsyncSession = Depends(get_db)
):
    """تسجيل مؤسسة جديدة - لا يؤثر على النظام الحالي"""
    try:
        # التحقق من عدم وجود المؤسسة مسبقاً
        email_result = await db.execute(
            select(InstitutionAdmin).where(InstitutionAdmin.email == registration_data.email)
        )
        if email_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="البريد الإلكتروني مسجل مسبقاً"
            )
        
        code_result = await db.execute(
            select(InstitutionAdmin).where(InstitutionAdmin.institution_code == registration_data.institution_code)
        )
        if code_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="كود المؤسسة مسجل مسبقاً"
            )
        
        # إنشاء المؤسسة الجديدة
        subscription_end = datetime.utcnow() + timedelta(days=registration_data.subscription_months * 30)
        
        institution = InstitutionAdmin(
            name=registration_data.name,
            email=registration_data.email,
            country=registration_data.country,
            institution_code=registration_data.institution_code,
            phone=registration_data.phone,
            subscription_start=datetime.utcnow(),
            subscription_end=subscription_end,
            is_active=False,  # بتكون غير نشطة حتى يتم التفعيل يدوياً
            # لا يوجد باسوورد - نظام مختلف عن المسؤولين الحاليين
        )
        
        db.add(institution)
        await db.commit()
        await db.refresh(institution)
        
        return {
            "message": "تم تسجيل المؤسسة بنجاح",
            "institution_id": institution.id,
            "subscription_end": institution.subscription_end,
            "status": "بانتظار التفعيل",
            "next_steps": "سيتم التواصل معكم خلال 24 ساعة لتفعيل الحساب"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطأ في تسجيل المؤسسة: {str(e)}"
        )

