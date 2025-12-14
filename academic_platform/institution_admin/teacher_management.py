# institution_admin/teacher_management.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional

from database.connection import get_db
from database.models import Teacher, StudyGroup, InstitutionAdmin
from auth.admin_permissions import get_current_admin

router = APIRouter()

class TeacherCreate(BaseModel):
    name: str
    email: Optional[str] = None
    specialization: Optional[str] = None

class TeacherResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    specialization: Optional[str]
    groups_count: int
    is_active: bool

@router.get("/teachers", response_model=List[TeacherResponse])
async def get_all_teachers(
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """الحصول على جميع مدرسي المؤسسة"""
    result = await db.execute(
        select(Teacher).where(Teacher.admin_id == admin.id)
    )
    teachers = result.scalars().all()
    
    teachers_response = []
    for teacher in teachers:
        # عدد المجموعات التي يديرها المدرس
        groups_result = await db.execute(
            select(StudyGroup).where(StudyGroup.teacher_id == teacher.id)
        )
        groups_count = len(groups_result.scalars().all())
        
        teachers_response.append(TeacherResponse(
            id=teacher.id,
            name=teacher.name,
            email=teacher.email,
            specialization=teacher.specialization,
            groups_count=groups_count,
            is_active=teacher.is_active
        ))
    
    return teachers_response

@router.post("/teachers", response_model=TeacherResponse)
async def create_teacher(
    teacher_data: TeacherCreate,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """إضافة مدرس جديد"""
    teacher = Teacher(
        name=teacher_data.name,
        email=teacher_data.email,
        specialization=teacher_data.specialization,
        country=admin.country,
        institution_code=admin.institution_code,
        admin_id=admin.id
    )
    
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    
    return TeacherResponse(
        id=teacher.id,
        name=teacher.name,
        email=teacher.email,
        specialization=teacher.specialization,
        groups_count=0,
        is_active=teacher.is_active
    )

@router.put("/teachers/{teacher_id}")
async def update_teacher(
    teacher_id: int,
    teacher_data: TeacherCreate,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """تحديث بيانات مدرس"""
    result = await db.execute(
        select(Teacher).where(
            Teacher.id == teacher_id,
            Teacher.admin_id == admin.id
        )
    )
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المدرس غير موجود"
        )
    
    teacher.name = teacher_data.name
    teacher.email = teacher_data.email
    teacher.specialization = teacher_data.specialization
    
    await db.commit()
    
    return {"message": "تم تحديث بيانات المدرس بنجاح"}

@router.delete("/teachers/{teacher_id}")
async def delete_teacher(
    teacher_id: int,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """حذف مدرس (تعطيله)"""
    result = await db.execute(
        select(Teacher).where(
            Teacher.id == teacher_id,
            Teacher.admin_id == admin.id
        )
    )
    teacher = result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المدرس غير موجود"
        )
    
    # التحقق إذا المدرس مربوط بمجموعات
    groups_result = await db.execute(
        select(StudyGroup).where(StudyGroup.teacher_id == teacher_id)
    )
    active_groups = groups_result.scalars().all()
    
    if active_groups:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكن حذف مدرس مربوط بمجموعات نشطة"
        )
    
    teacher.is_active = False
    await db.commit()
    
    return {"message": "تم تعطيل المدرس بنجاح"}