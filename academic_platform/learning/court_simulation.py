# learning/court_simulation.py
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid

from database.connection import get_db
from database.models import InstitutionAdmin, StudyGroup, Student
from auth.admin_permissions import get_current_admin

router = APIRouter()

class SimulationScenario(BaseModel):
    title: str
    case_type: str  # جنائي, تجاري, إداري
    difficulty: str
    case_facts: str
    legal_issues: List[str]
    roles: List[str]  # قاضي, مدع, مدعى عليه, محامي
    time_limit: int  # بالدقائق

class SimulationSession(BaseModel):
    id: str
    title: str
    case_type: str
    difficulty: str
    participants: List[str]
    status: str  # pending, active, completed
    created_at: datetime

@router.post("/simulations/create")
async def create_simulation_session(
    scenario: SimulationScenario,
    target_groups: List[int],
    admin: InstitutionAdmin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """إنشاء جلسة محاكاة قضائية"""
    
    # إنشاء جلسة محاكاة
    session_id = str(uuid.uuid4())
    
    return SimulationSession(
        id=session_id,
        title=scenario.title,
        case_type=scenario.case_type,
        difficulty=scenario.difficulty,
        participants=[],  # سيتم إضافة الطلاب لاحقاً
        status="pending",
        created_at=datetime.utcnow()
    )

@router.get("/simulations/scenarios")
async def get_available_scenarios():
    """الحصول على سيناريوهات المحاكاة المتاحة"""
    return {
        "scenarios": [
            {
                "id": "criminal_1",
                "title": "قضية سرقة مسلحة",
                "case_type": "جنائي",
                "difficulty": "متوسط",
                "description": "محاكاة قضية سرقة مسلحة مع أدلة متناقضة",
                "estimated_time": 45,
                "roles": ["قاضي", "مدع عام", "محامي دفاع", "متهم", "شاهد"]
            },
            {
                "id": "commercial_1", 
                "title": "نزاع على عقد تجاري",
                "case_type": "تجاري",
                "difficulty": "متقدم",
                "description": "محاكاة نزاع على عقد توريد بضائع",
                "estimated_time": 60,
                "roles": ["قاضي", "محامي مدعي", "محامي مدعى عليه", "خبير"]
            }
        ]
    }