# learning/assessment_engine.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import random

from database.connection import get_db
from database.models import InstitutionAdmin, StudyGroup, Student
from auth.admin_permissions import get_current_admin

router = APIRouter()

class ExerciseCreate(BaseModel):
    title: str
    exercise_type: str  # multiple_choice, case_analysis, legal_drafting
    question: str
    options: Optional[List[str]] = None
    correct_answer: Any
    explanation: str
    difficulty: str
    target_groups: List[int]
    time_limit: Optional[int] = None  # بالثواني

class ExerciseResponse(BaseModel):
    id: int
    title: str
    exercise_type: str
    question: str
    options: Optional[List[str]]
    difficulty: str
    target_groups: List[str]
    created_at: datetime

@router.post("/exercises", response_model=ExerciseResponse)
async def create_exercise(
    exercise_data: ExerciseCreate,
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """إنشاء تمرين جديد"""
    # التحقق من المجموعات المستهدفة
    valid_groups = []
    for group_id in exercise_data.target_groups:
        group_result = await db.execute(
            select(StudyGroup).where(
                StudyGroup.id == group_id,
                StudyGroup.admin_id == admin.id
            )
        )
        group = group_result.scalar_one_or_none()
        if group:
            valid_groups.append(group.name)
    
    # هنا هنضيف التمرين للداتابيز
    # حالياً نرجع response وهمي
    return ExerciseResponse(
        id=1,
        title=exercise_data.title,
        exercise_type=exercise_data.exercise_type,
        question=exercise_data.question,
        options=exercise_data.options,
        difficulty=exercise_data.difficulty,
        target_groups=valid_groups,
        created_at=datetime.utcnow()
    )

@router.get("/exercises/auto-generate")
async def auto_generate_exercise(
    topic: str,
    exercise_type: str,
    difficulty: str,
    target_groups: List[int],
    admin: InstitutionAdmin = Depends(get_current_admin)
):
    """توليد تمرين تلقائي باستخدام AI"""
    # محتوى وهمي للتجربة
    sample_exercises = {
        "multiple_choice": {
            "title": f"اختبار: {topic}",
            "question": f"ما هو التعريف الصحيح لـ {topic}؟",
            "options": [
                "التعريف الأول",
                "التعريف الثاني", 
                "التعريف الثالث",
                "التعريف الرابع"
            ],
            "correct_answer": 0,
            "explanation": f"التعريف الصحيح لـ {topic} هو...",
            "difficulty": difficulty
        },
        "case_analysis": {
            "title": f"تحليل قضية: {topic}",
            "question": f"قوم بتحليل القضية التالية المتعلقة بـ {topic}...",
            "correct_answer": "تحليل مفصل للقضية",
            "explanation": "التحليل الصحيح يشمل...",
            "difficulty": difficulty
        }
    }
    
    exercise_template = sample_exercises.get(exercise_type, sample_exercises["multiple_choice"])
    
    return {
        "generated_exercise": exercise_template,
        "ai_service_used": False,
        "message": "تم توليد التمرين بنجاح"
    }