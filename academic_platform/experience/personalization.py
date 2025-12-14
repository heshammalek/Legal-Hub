# experience/personalization.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any

from auth.admin_permissions import get_current_admin
from database.models import InstitutionAdmin

router = APIRouter()

class UserPreferences(BaseModel):
    theme: str
    animations_enabled: bool
    sound_effects: bool
    difficulty: str
    learning_style: str
    notifications: Dict[str, bool]

@router.get("/preferences")
async def get_user_preferences(
    admin: InstitutionAdmin = Depends(get_current_admin)
):
    """تفضيلات المستخدم الشخصية"""
    
    return UserPreferences(
        theme="modern_arabic",
        animations_enabled=True,
        sound_effects=True,
        difficulty="adaptive",
        learning_style="interactive",
        notifications={
            "daily_challenge": True,
            "new_content": True,
            "performance_updates": True,
            "milestone_achievements": True
        }
    )