# institution_admin/immersive_dashboard.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
import random

from auth.admin_permissions import get_current_admin
from database.models import InstitutionAdmin

router = APIRouter()

class DashboardExperience(BaseModel):
    theme: str
    background: str
    animations: List[str]
    sound_effects: List[str]
    quick_actions: List[Dict[str, Any]]
    motivational_quotes: List[str]
    progress_visualization: Dict[str, Any]

@router.get("/dashboard/experience")
async def get_dashboard_experience(
    admin: InstitutionAdmin = Depends(get_current_admin)
):
    """تجربة داشبورد غامرة مع عناصر gamification"""
    
    # تحديد السمة حسب الدولة
    themes = {
        "SA": {"name": "الصحراء الذهبية", "colors": ["#C19A6B", "#E8D0A9", "#B86B25"]},
        "EG": {"name": "النيل الأزرق", "colors": ["#1E90FF", "#87CEEB", "#000080"]},
        "AE": {"name": "الخليج الفضي", "colors": ["#4682B4", "#B0C4DE", "#2F4F4F"]}
    }
    
    theme = themes.get(admin.country, themes["SA"])
    
    return DashboardExperience(
        theme=theme["name"],
        background=f"courtroom_{admin.country.lower()}",
        animations=["gavel_bounce", "scroll_unroll", "wisdom_glow"],
        sound_effects=["courtroom_ambience", "page_turn", "gavel_sound"],
        quick_actions=[
            {
                "icon": "⚡",
                "title": "تحدي اليوم",
                "action": "start_daily_challenge",
                "color": "#FF6B6B",
                "pulse": True
            },
            {
                "icon": "🎯", 
                "title": "محاكاة سريعة",
                "action": "quick_simulation",
                "color": "#4ECDC4"
            },
            {
                "icon": "📊",
                "title": "تقرير الأداء",
                "action": "performance_report", 
                "color": "#45B7D1"
            }
        ],
        motivational_quotes=[
            "المحامي الناجح لا يخشى الصعاب، بل يتقن فن تحويلها إلى فرص 🎯",
            "كل قضية هي رحلة استكشاف جديدة في عالم القانون 🌟",
            "الإعداد الجيد هو سر المرافعة المؤثرة 💼"
        ],
        progress_visualization={
            "type": "legal_journey_map",
            "milestones": [
                {"title": "تأسيس المجموعات", "completed": True, "icon": "👥"},
                {"title": "تدريب المدرسين", "completed": True, "icon": "👨‍🏫"},
                {"title": "أول محاكاة", "completed": False, "icon": "⚖️"},
                {"title": "تقرير الربع الأول", "completed": False, "icon": "📈"}
            ]
        }
    )