# institution_admin/case_management.py
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_, or_, func
from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio

from database.connection import get_db
from database.models import LegalCase, CaseAttempt, Teacher, Student, StudyGroup
from auth.teacher_permissions import get_current_teacher

router = APIRouter()

# 📋 نماذج البيانات
class CaseCreate(BaseModel):
    title: str
    description: str
    case_type: str
    difficulty: str
    group_id: int
    legal_issues: Optional[str] = None
    facts: Optional[str] = None
    legal_basis: Optional[str] = None
    expected_solution: Optional[str] = None
    max_attempts: int = 3
    time_limit_minutes: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    @validator('end_date')
    def validate_dates(cls, end_date, values):
        if end_date and values.get('start_date'):
            if end_date <= values['start_date']:
                raise ValueError('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء')
        return end_date

class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    case_type: Optional[str] = None
    difficulty: Optional[str] = None
    legal_issues: Optional[str] = None
    facts: Optional[str] = None
    legal_basis: Optional[str] = None
    expected_solution: Optional[str] = None
    max_attempts: Optional[int] = None
    time_limit_minutes: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None  # active, paused, closed

class CaseResponse(BaseModel):
    id: int
    title: str
    description: str
    case_type: str
    difficulty: str
    legal_issues: Optional[str]
    facts: Optional[str]
    legal_basis: Optional[str]
    expected_solution: Optional[str]
    max_attempts: int
    time_limit_minutes: Optional[int]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    status: str
    is_active: bool
    group_name: str
    students_count: int
    active_attempts: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CaseAttemptResponse(BaseModel):
    id: int
    student_name: str
    student_id: str
    attempt_number: int
    score: Optional[float]
    time_spent_minutes: int
    submitted_at: datetime
    feedback: Optional[str]

class CaseAnalytics(BaseModel):
    total_cases: int
    active_cases: int
    total_attempts: int
    average_score: float
    completion_rate: float
    popular_case_types: List[Dict[str, Any]]

# 🚀 Endpoints الأساسية
@router.post("/cases", response_model=CaseResponse)
async def create_case(
    case_data: CaseCreate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """إنشاء قضية جديدة"""
    # التحقق من أن المجموعة تابعة للمدرس
    group_result = await db.execute(
        select(StudyGroup).where(
            StudyGroup.id == case_data.group_id,
            StudyGroup.teacher_id == teacher.id
        )
    )
    group = group_result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المجموعة غير موجودة أو لا تنتمي للمدرس"
        )
    
    # إنشاء القضية
    case = LegalCase(
        **case_data.dict(),
        teacher_id=teacher.id
    )
    
    db.add(case)
    await db.commit()
    await db.refresh(case)
    
    return await _enrich_case_response(case, db)

@router.get("/cases", response_model=List[CaseResponse])
async def get_teacher_cases(
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = None,
    group_id: Optional[int] = None
):
    """الحصول على جميع قضايا المدرس"""
    query = select(LegalCase).where(LegalCase.teacher_id == teacher.id)
    
    # التصفية حسب الحالة
    if status_filter:
        query = query.where(LegalCase.status == status_filter)
    
    # التصفية حسب المجموعة
    if group_id:
        query = query.where(LegalCase.group_id == group_id)
    
    result = await db.execute(query.order_by(LegalCase.created_at.desc()))
    cases = result.scalars().all()
    
    # إثراء البيانات
    enriched_cases = []
    for case in cases:
        enriched_cases.append(await _enrich_case_response(case, db))
    
    return enriched_cases

@router.get("/cases/{case_id}", response_model=CaseResponse)
async def get_case_details(
    case_id: int,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """الحصول على تفاصيل قضية محددة"""
    case = await _get_teacher_case(case_id, teacher.id, db)
    return await _enrich_case_response(case, db)

@router.put("/cases/{case_id}", response_model=CaseResponse)
async def update_case(
    case_id: int,
    case_data: CaseUpdate,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """تعديل بيانات القضية"""
    case = await _get_teacher_case(case_id, teacher.id, db)
    
    # تحديث الحقول
    update_data = case_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(case, field, value)
    
    case.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(case)
    
    return await _enrich_case_response(case, db)

@router.delete("/cases/{case_id}")
async def delete_case(
    case_id: int,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """حذف قضية (تعطيلها)"""
    case = await _get_teacher_case(case_id, teacher.id, db)
    
    case.is_active = False
    case.status = "closed"
    await db.commit()
    
    return {"message": "تم حذف القضية بنجاح"}

# 🎯 إدارة الحالة والتحكم
@router.put("/cases/{case_id}/pause")
async def pause_case(
    case_id: int,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """إيقاف القضية مؤقتاً"""
    case = await _get_teacher_case(case_id, teacher.id, db)
    
    case.status = "paused"
    case.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "تم إيقاف القضية مؤقتاً"}

@router.put("/cases/{case_id}/activate")
async def activate_case(
    case_id: int,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """تفعيل القضية"""
    case = await _get_teacher_case(case_id, teacher.id, db)
    
    # التحقق من المهلة الزمنية
    if case.end_date and case.end_date < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا يمكن تفعيل قضية انتهت مهلتها الزمنية"
        )
    
    case.status = "active"
    case.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "تم تفعيل القضية"}

@router.put("/cases/{case_id}/extend-time")
async def extend_case_time(
    case_id: int,
    new_end_date: datetime,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """تمديد المهلة الزمنية للقضية"""
    case = await _get_teacher_case(case_id, teacher.id, db)
    
    if new_end_date <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="تاريخ الانتهاء الجديد يجب أن يكون في المستقبل"
        )
    
    case.end_date = new_end_date
    case.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": f"تم تمديد المهلة إلى {new_end_date}"}

# 📊 متابعة المحاولات والتقييم
@router.get("/cases/{case_id}/attempts", response_model=List[CaseAttemptResponse])
async def get_case_attempts(
    case_id: int,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """الحصول على محاولات الطلاب في قضية محددة"""
    case = await _get_teacher_case(case_id, teacher.id, db)
    
    result = await db.execute(
        select(CaseAttempt)
        .where(CaseAttempt.case_id == case_id)
        .order_by(CaseAttempt.submitted_at.desc())
    )
    attempts = result.scalars().all()
    
    attempts_response = []
    for attempt in attempts:
        # الحصول على بيانات الطالب
        student_result = await db.execute(
            select(Student).where(Student.id == attempt.student_id)
        )
        student = student_result.scalar_one()
        
        attempts_response.append(CaseAttemptResponse(
            id=attempt.id,
            student_name=student.name,
            student_id=student.student_id,
            attempt_number=attempt.attempt_number,
            score=attempt.score,
            time_spent_minutes=attempt.time_spent_minutes,
            submitted_at=attempt.submitted_at,
            feedback=attempt.feedback
        ))
    
    return attempts_response

@router.put("/attempts/{attempt_id}/feedback")
async def add_feedback(
    attempt_id: int,
    feedback_data: dict,
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """إضافة تعليق وتقييم على محاولة طالب"""
    result = await db.execute(
        select(CaseAttempt)
        .join(LegalCase)
        .where(
            and_(
                CaseAttempt.id == attempt_id,
                LegalCase.teacher_id == teacher.id
            )
        )
    )
    attempt = result.scalar_one_or_none()
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المحاولة غير موجودة"
        )
    
    attempt.feedback = feedback_data.get('feedback')
    attempt.score = feedback_data.get('score')
    await db.commit()
    
    return {"message": "تم إضافة التقييم بنجاح"}

# 📈 إحصائيات وتحليلات
@router.get("/cases/analytics/overview", response_model=CaseAnalytics)
async def get_cases_analytics(
    teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db)
):
    """الحصول على إحصائيات شاملة لقضايا المدرس"""
    # إجمالي القضايا
    total_cases_result = await db.execute(
        select(func.count(LegalCase.id)).where(LegalCase.teacher_id == teacher.id)
    )
    total_cases = total_cases_result.scalar()
    
    # القضايا النشطة
    active_cases_result = await db.execute(
        select(func.count(LegalCase.id)).where(
            and_(
                LegalCase.teacher_id == teacher.id,
                LegalCase.status == "active"
            )
        )
    )
    active_cases = active_cases_result.scalar()
    
    # إجمالي المحاولات
    total_attempts_result = await db.execute(
        select(func.count(CaseAttempt.id))
        .select_from(CaseAttempt)
        .join(LegalCase)
        .where(LegalCase.teacher_id == teacher.id)
    )
    total_attempts = total_attempts_result.scalar()
    
    # متوسط النتائج
    avg_score_result = await db.execute(
        select(func.avg(CaseAttempt.score))
        .select_from(CaseAttempt)
        .join(LegalCase)
        .where(
            and_(
                LegalCase.teacher_id == teacher.id,
                CaseAttempt.score.isnot(None)
            )
        )
    )
    average_score = avg_score_result.scalar() or 0
    
    # أنواع القضايا الأكثر شيوعاً
    popular_types_result = await db.execute(
        select(
            LegalCase.case_type,
            func.count(LegalCase.id).label('count')
        )
        .where(LegalCase.teacher_id == teacher.id)
        .group_by(LegalCase.case_type)
        .order_by(func.count(LegalCase.id).desc())
        .limit(5)
    )
    popular_case_types = [
        {"type": row[0], "count": row[1]} 
        for row in popular_types_result.all()
    ]
    
    return CaseAnalytics(
        total_cases=total_cases,
        active_cases=active_cases,
        total_attempts=total_attempts,
        average_score=round(average_score, 2),
        completion_rate=round((active_cases / total_cases * 100) if total_cases > 0 else 0, 2),
        popular_case_types=popular_case_types
    )

# 🔧 دوال مساعدة
async def _get_teacher_case(case_id: int, teacher_id: int, db: AsyncSession):
    """الحصول على قضية والتأكد من أنها تابعة للمدرس"""
    result = await db.execute(
        select(LegalCase).where(
            and_(
                LegalCase.id == case_id,
                LegalCase.teacher_id == teacher_id
            )
        )
    )
    case = result.scalar_one_or_none()
    
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="القضية غير موجودة"
        )
    
    return case

async def _enrich_case_response(case: LegalCase, db: AsyncSession):
    """إثراء بيانات الاستجابة بمعلومات إضافية"""
    # اسم المجموعة
    group_result = await db.execute(
        select(StudyGroup).where(StudyGroup.id == case.group_id)
    )
    group = group_result.scalar_one()
    
    # عدد الطلاب في المجموعة
    students_count_result = await db.execute(
        select(func.count(Student.id)).where(
            and_(
                Student.group_id == case.group_id,
                Student.is_active == True
            )
        )
    )
    students_count = students_count_result.scalar()
    
    # عدد المحاولات النشطة
    active_attempts_result = await db.execute(
        select(func.count(CaseAttempt.id)).where(
            and_(
                CaseAttempt.case_id == case.id,
                CaseAttempt.submitted_at >= datetime.utcnow() - timedelta(days=7)
            )
        )
    )
    active_attempts = active_attempts_result.scalar()
    
    return CaseResponse(
        id=case.id,
        title=case.title,
        description=case.description,
        case_type=case.case_type,
        difficulty=case.difficulty,
        legal_issues=case.legal_issues,
        facts=case.facts,
        legal_basis=case.legal_basis,
        expected_solution=case.expected_solution,
        max_attempts=case.max_attempts,
        time_limit_minutes=case.time_limit_minutes,
        start_date=case.start_date,
        end_date=case.end_date,
        status=case.status,
        is_active=case.is_active,
        group_name=group.name,
        students_count=students_count,
        active_attempts=active_attempts,
        created_at=case.created_at
    )