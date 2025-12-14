# institution_admin/student_management.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional

from database.connection import get_db
from database.models import Student, StudyGroup, InstitutionAdmin
from auth.admin_permissions import get_current_admin

router = APIRouter()

class StudentCreate(BaseModel):
    name: str
    email: Optional[str] = None
    student_id: Optional[str] = None
    group_id: Optional[int] = None

class StudentResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    student_id: Optional[str]
    group_name: Optional[str]
    is_active: bool

@router.get("/students", response_model=List[StudentResponse])
async def get_all_students(
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """الحصول على جميع طلاب المؤسسة"""
    result = await db.execute(
        select(Student).where(Student.admin_id == admin.id)
    )
    students = result.scalars().all()
    
    students_response = []
    for student in students:
        group_name = None
        if student.group_id:
            group_result = await db.execute(
                select(StudyGroup).where(StudyGroup.id == student.group_id)
            )
            group = group_result.scalar_one_or_none()
            group_name = group.name if group else None
        
        students_response.append(StudentResponse(
            id=student.id,
            name=student.name,
            email=student.email,
            student_id=student.student_id,
            group_name=group_name,
            is_active=student.is_active
        ))
    
    return students_response

@router.post("/students", response_model=StudentResponse)
async def create_student(
    student_data: StudentCreate,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """إضافة طالب جديد"""
    # التحقق من المجموعة إذا تم تحديدها
    group_name = None
    if student_data.group_id:
        group_result = await db.execute(
            select(StudyGroup).where(
                StudyGroup.id == student_data.group_id,
                StudyGroup.admin_id == admin.id
            )
        )
        group = group_result.scalar_one_or_none()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="المجموعة غير موجودة أو لا تنتمي للمؤسسة"
            )
        group_name = group.name
    
    student = Student(
        name=student_data.name,
        email=student_data.email,
        student_id=student_data.student_id,
        country=admin.country,
        institution_code=admin.institution_code,
        admin_id=admin.id,
        group_id=student_data.group_id
    )
    
    db.add(student)
    await db.commit()
    await db.refresh(student)
    
    return StudentResponse(
        id=student.id,
        name=student.name,
        email=student.email,
        student_id=student.student_id,
        group_name=group_name,
        is_active=student.is_active
    )

@router.put("/students/{student_id}")
async def update_student(
    student_id: int,
    student_data: StudentCreate,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """تحديث بيانات طالب"""
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.admin_id == admin.id
        )
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطالب غير موجود"
        )
    
    # التحقق من المجموعة الجديدة
    if student_data.group_id and student_data.group_id != student.group_id:
        group_result = await db.execute(
            select(StudyGroup).where(
                StudyGroup.id == student_data.group_id,
                StudyGroup.admin_id == admin.id
            )
        )
        group = group_result.scalar_one_or_none()
        if not group:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="المجموعة غير موجودة أو لا تنتمي للمؤسسة"
            )
    
    student.name = student_data.name
    student.email = student_data.email
    student.student_id = student_data.student_id
    student.group_id = student_data.group_id
    
    await db.commit()
    
    return {"message": "تم تحديث بيانات الطالب بنجاح"}

@router.delete("/students/{student_id}")
async def delete_student(
    student_id: int,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """حذف طالب (تعطيله)"""
    result = await db.execute(
        select(Student).where(
            Student.id == student_id,
            Student.admin_id == admin.id
        )
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطالب غير موجود"
        )
    
    student.is_active = False
    await db.commit()
    
    return {"message": "تم تعطيل الطالب بنجاح"}