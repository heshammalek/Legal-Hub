# backend/app/api/v1/endpoints/user.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session
from app.core.security import get_current_active_user, get_current_user_from_cookie
from app.models.user_models import User, UserRole
from app.database.connection import get_session
from app.database import crud
from typing import List, Dict, Any

router = APIRouter(
    prefix="/api/v1/users",
    tags=["User"],
)

@router.get("/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get current user profile information"""
    try:
        # جلب بيانات الملف الشخصي
        profile_data = None
        if current_user.profile:
            profile_data = {
                "full_name": current_user.profile.full_name,
                "national_id": current_user.profile.national_id,
                "date_of_birth": current_user.profile.date_of_birth
            }
        
        return {
            "id": current_user.id,
            "email": current_user.email,
            "phone": current_user.phone,
            "country": current_user.country,
            "role": current_user.role.value,
            "user_type": current_user.role.value,
            "is_active": current_user.is_active,
            "profile": profile_data,
            "created_at": current_user.created_at,
            "last_login": current_user.last_login
        }
    except Exception as e:
        print(f"Profile endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطأ في جلب بيانات المستخدم: {str(e)}"
        )

@router.get("/dashboard")
async def get_user_dashboard(
    current_user: User = Depends(get_current_user_from_cookie),   #get_current_user_from_cookie او get_current_active_user
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    Provides all necessary data for the user's dashboard.
    """
    try:
        # جلب بيانات الملف الشخصي
        profile_data = {
            "full_name": "مستخدم",  # قيمة افتراضية
            "email": current_user.email,
            "phone": current_user.phone,
            "country": current_user.country,
            "role": current_user.role.value
        }
        
        # إذا كان الملف الشخصي موجوداً، استخدم البيانات الحقيقية
        if current_user.profile:
            profile_data.update({
                "full_name": current_user.profile.full_name or "مستخدم",
                "national_id": current_user.profile.national_id,
                "date_of_birth": current_user.profile.date_of_birth
            })

        # المحامون القريبون (placeholder data)
        nearby_lawyers = [
            {
                "id": "1",
                "name": "أحمد محمد",
                "specialization": "القانون المدني",
                "rating": 4.5,
                "distance": "2.5 كم",
                "lat": 30.0444,
                "lng": 31.2357
            },
            {
                "id": "2", 
                "name": "فاطمة علي",
                "specialization": "القانون الجنائي",
                "rating": 4.8,
                "distance": "3.1 كم", 
                "lat": 30.0626,
                "lng": 31.2497
            }
        ]

        # الاستشارات (placeholder data)
        consultations = [
            {
                "id": "1",
                "title": "استشارة قانونية عامة",
                "status": "مكتملة",
                "date": "2024-01-15",
                "lawyer_name": "أحمد محمد"
            }
        ]

        # إحصائيات المستخدم
        stats = {
            "total_consultations": len(consultations),
            "active_cases": 0,
            "completed_consultations": 1,
            "favorite_lawyers": 0
        }

        return {
            "message": "تم جلب بيانات الداشبورد بنجاح",
            "profile": profile_data,
            "nearbyLawyers": nearby_lawyers,
            "consultations": consultations,
            "stats": stats,
            "notifications": [
                {
                    "id": "1",
                    "message": "مرحباً بك في Legal Hub!",
                    "type": "info",
                    "read": False,
                    "created_at": "2024-01-20T10:00:00"
                }
            ]
        }
        
    except Exception as e:
        print(f"Dashboard error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"حدث خطأ في جلب بيانات الداشبورد: {str(e)}"
        )