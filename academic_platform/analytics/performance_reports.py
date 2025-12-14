# analytics/performance_reports.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime, timedelta

from database.connection import get_db
from database.models import InstitutionAdmin, Student, StudyGroup
from auth.admin_permissions import get_current_admin

router = APIRouter()

class PerformanceReport(BaseModel):
    period: str
    total_students: int
    active_students: int
    average_performance: float
    top_performers: List[Dict[str, Any]]
    weak_areas: List[str]
    recommendations: List[str]

@router.get("/reports/performance", response_model=PerformanceReport)
async def get_performance_report(
    period: str = "weekly",  # weekly, monthly, quarterly
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """تقرير أداء الطلاب"""
    
    # إحصائيات وهمية للتجربة
    return PerformanceReport(
        period=period,
        total_students=15,
        active_students=12,
        average_performance=78.5,
        top_performers=[
            {"student_name": "أحمد محمود", "score": 95, "group": "المجموعة التجارية"},
            {"student_name": "فاطمة علي", "score": 92, "group": "المجموعة الدستورية"}
        ],
        weak_areas=["القانون الجنائي", "الإثبات في القضايا"],
        recommendations=[
            "زيادة التمارين في مجال القانون الجنائي",
            "عقد جلسات محاكاة إضافية",
            "توفير مراجع إضافية للإثبات"
        ]
    )

@router.get("/reports/group/{group_id}")
async def get_group_report(
    group_id: int,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """تقرير أداء مجموعة محددة"""
    
    # التحقق من المجموعة
    group_result = await db.execute(
        select(StudyGroup).where(
            StudyGroup.id == group_id,
            StudyGroup.admin_id == admin.id
        )
    )
    group = group_result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="المجموعة غير موجودة")
    
    return {
        "group_name": group.name,
        "teacher": group.teacher.name if group.teacher else "غير معين",
        "total_students": 8,
        "average_score": 82.3,
        "participation_rate": 87.5,
        "strong_areas": ["القانون التجاري", "الصياغة القانونية"],
        "needs_improvement": ["المحاكمات", "المرافعة"]
    }