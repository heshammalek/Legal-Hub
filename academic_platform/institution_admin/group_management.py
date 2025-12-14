# institution_admin/group_management.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional

from database.connection import get_db
from database.models import StudyGroup, Teacher, Student, InstitutionAdmin
from auth.admin_permissions import get_current_admin

router = APIRouter()

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    teacher_id: Optional[int] = None

class GroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    teacher_name: Optional[str]
    students_count: int
    is_active: bool


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    teacher_id: Optional[int] = None
    is_active: Optional[bool] = None


@router.get("/groups", response_model=List[GroupResponse])
async def get_all_groups(
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """الحصول على جميع مجموعات المؤسسة"""
    result = await db.execute(
        select(StudyGroup).where(StudyGroup.admin_id == admin.id)
    )
    groups = result.scalars().all()
    
    groups_response = []
    for group in groups:
        # عدد الطلاب في المجموعة
        students_result = await db.execute(
            select(Student).where(Student.group_id == group.id)
        )
        students_count = len(students_result.scalars().all())
        
        # اسم المدرس
        teacher_name = None
        if group.teacher_id:
            teacher_result = await db.execute(
                select(Teacher).where(Teacher.id == group.teacher_id)
            )
            teacher = teacher_result.scalar_one_or_none()
            teacher_name = teacher.name if teacher else None
        
        groups_response.append(GroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            teacher_name=teacher_name,
            students_count=students_count,
            is_active=group.is_active
        ))
    
    return groups_response

@router.post("/groups", response_model=GroupResponse)
async def create_group(
    group_data: GroupCreate,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """إنشاء مجموعة جديدة"""
    # التحقق من المدرس إذا تم تحديده
    if group_data.teacher_id:
        teacher_result = await db.execute(
            select(Teacher).where(
                Teacher.id == group_data.teacher_id,
                Teacher.admin_id == admin.id
            )
        )
        teacher = teacher_result.scalar_one_or_none()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="المدرس غير موجود أو لا ينتمي للمؤسسة"
            )
    
    group = StudyGroup(
        name=group_data.name,
        description=group_data.description,
        country=admin.country,
        institution_code=admin.institution_code,
        admin_id=admin.id,
        teacher_id=group_data.teacher_id
    )
    
    db.add(group)
    await db.commit()
    await db.refresh(group)
    
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        teacher_name=teacher.name if teacher else None,
        students_count=0,
        is_active=group.is_active
    )

@router.delete("/groups/{group_id}")
async def delete_group(
    group_id: int,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """حذف مجموعة (حذف فعلي)"""
    result = await db.execute(
        select(StudyGroup).where(
            StudyGroup.id == group_id,
            StudyGroup.admin_id == admin.id
        )
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المجموعة غير موجودة"
        )
    
    # 🔴 بدل ما نغير is_active لـ false
    # group.is_active = False
    
    # ✅ نحذف المجموعة فعلياً من الداتابيز
    await db.delete(group)
    await db.commit()
    
    return {"message": "تم حذف المجموعة بنجاح"}


@router.put("/groups/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int,
    group_data: GroupUpdate,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """تعديل بيانات المجموعة"""
    result = await db.execute(
        select(StudyGroup).where(
            StudyGroup.id == group_id,
            StudyGroup.admin_id == admin.id
        )
    )
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المجموعة غير موجودة"
        )
    
    # تحديث الحقول المرسلة فقط
    if group_data.name is not None:
        group.name = group_data.name
    if group_data.description is not None:
        group.description = group_data.description
    if group_data.is_active is not None:
        group.is_active = group_data.is_active
    
    # التحقق من المدرس إذا تم تحديثه
    if group_data.teacher_id is not None:
        if group_data.teacher_id == 0:  # إذا كان 0 يعني إزالة المدرس
            group.teacher_id = None
        else:
            teacher_result = await db.execute(
                select(Teacher).where(
                    Teacher.id == group_data.teacher_id,
                    Teacher.admin_id == admin.id
                )
            )
            teacher = teacher_result.scalar_one_or_none()
            if not teacher:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="المدرس غير موجود أو لا ينتمي للمؤسسة"
                )
            group.teacher_id = group_data.teacher_id
    
    await db.commit()
    await db.refresh(group)
    
    # حساب عدد الطلاب واسم المدرس للت response
    students_result = await db.execute(
        select(Student).where(Student.group_id == group.id)
    )
    students_count = len(students_result.scalars().all())
    
    teacher_name = None
    if group.teacher_id:
        teacher_result = await db.execute(
            select(Teacher).where(Teacher.id == group.teacher_id)
        )
        teacher = teacher_result.scalar_one_or_none()
        teacher_name = teacher.name if teacher else None
    
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        teacher_name=teacher_name,
        students_count=students_count,
        is_active=group.is_active
    )





class AssignTeacherRequest(BaseModel):
    teacher_id: int

@router.put("/groups/{group_id}/assign-teacher")
async def assign_teacher_to_group(
    group_id: int,
    assign_data: AssignTeacherRequest,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """تعيين مدرس لمجموعة"""
    # التحقق من وجود المجموعة وتنتمي للمؤسسة
    group_result = await db.execute(
        select(StudyGroup).where(
            StudyGroup.id == group_id,
            StudyGroup.admin_id == admin.id
        )
    )
    group = group_result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المجموعة غير موجودة"
        )
    
    # التحقق من وجود المدرس وتنتمي للمؤسسة
    teacher_result = await db.execute(
        select(Teacher).where(
            Teacher.id == assign_data.teacher_id,
            Teacher.admin_id == admin.id
        )
    )
    teacher = teacher_result.scalar_one_or_none()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المدرس غير موجود"
        )
    
    # تعيين المدرس للمجموعة
    group.teacher_id = assign_data.teacher_id
    await db.commit()
    
    return {"message": f"تم تعيين {teacher.name} للمجموعة بنجاح"}

@router.put("/groups/{group_id}/remove-teacher")
async def remove_teacher_from_group(
    group_id: int,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """إزالة المدرس من مجموعة"""
    group_result = await db.execute(
        select(StudyGroup).where(
            StudyGroup.id == group_id,
            StudyGroup.admin_id == admin.id
        )
    )
    group = group_result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المجموعة غير موجودة"
        )
    
    group.teacher_id = None
    await db.commit()
    
    return {"message": "تم إزالة المدرس من المجموعة بنجاح"}