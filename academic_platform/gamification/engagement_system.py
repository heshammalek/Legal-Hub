# gamification/engagement_system.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random

from auth.admin_permissions import get_current_admin
from database.models import InstitutionAdmin

router = APIRouter()

class AchievementSystem(BaseModel):
    points: int
    level: str
    badges: List[Dict[str, Any]]
    streak: int
    leaderboard_position: int
    next_milestone: Dict[str, Any]

@router.get("/gamification/profile")
async def get_gamification_profile(
    admin: InstitutionAdmin = Depends(get_current_admin)
):
    """ملف الإنجازات والتحديات"""
    
    achievements = [
        {
            "id": "pioneer",
            "name": "⚡ الرائد",
            "description": "إنشاء أول مجموعة دراسية",
            "earned": True,
            "earned_date": datetime.utcnow() - timedelta(days=2),
            "icon": "⚡"
        },
        {
            "id": "mentor", 
            "name": "👨‍🏫 المعلم المبدع",
            "description": "تعيين 3 مدرسين",
            "earned": True,
            "earned_date": datetime.utcnow() - timedelta(days=1),
            "icon": "👨‍🏫"
        },
        {
            "id": "simulation_master",
            "name": "🎮 سيد المحاكاة", 
            "description": "إكمال 5 جلسات محاكاة",
            "earned": False,
            "progress": 2,
            "target": 5,
            "icon": "🎮"
        }
    ]
    
    return AchievementSystem(
        points=450,
        level="محامي صاعد",
        badges=achievements,
        streak=7,
        leaderboard_position=3,
        next_milestone={
            "title": "الوصول إلى 1000 نقطة",
            "reward": "🦉 بومة الحكمة",
            "progress": 45
        }
    )

@router.get("/daily-challenge")
async def get_daily_challenge(
    admin: InstitutionAdmin = Depends(get_current_admin)
):
    """تحدي يومي تفاعلي"""
    
    challenges = [
        {
            "title": "🧠 اختبار القانون التجاري السريع",
            "description": "أجب على 5 أسئلة في 3 دقائق",
            "reward": 50,
            "difficulty": "سهل",
            "time_limit": 180,
            "topic": "commercial_law"
        },
        {
            "title": "⚖️ محاكاة قضية مصغرة", 
            "description": "حلل قضية جنائية في 10 دقائق",
            "reward": 100,
            "difficulty": "متوسط",
            "time_limit": 600,
            "topic": "criminal_law"
        }
    ]
    
    return random.choice(challenges)