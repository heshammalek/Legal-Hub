from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from database.connection import get_db
from database.models import InstitutionAdmin, StudyGroup, Teacher, Student
from auth.admin_permissions import get_current_admin

router = APIRouter()

class DashboardStats(BaseModel):
    groups_count: int
    teachers_count: int
    students_count: int

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    groups_result = await db.execute(select(StudyGroup).where(StudyGroup.admin_id == admin.id))
    teachers_result = await db.execute(select(Teacher).where(Teacher.admin_id == admin.id))
    students_result = await db.execute(select(Student).where(Student.admin_id == admin.id))
    
    return DashboardStats(
        groups_count=len(groups_result.scalars().all()),
        teachers_count=len(teachers_result.scalars().all()),
        students_count=len(students_result.scalars().all())
    )

@router.get("/institution-info")
async def get_institution_info(admin: InstitutionAdmin = Depends(get_current_admin)):
    return {
        "institution_name": admin.institution_name,
        "country": admin.country,
        "institution_code": admin.institution_code
    }