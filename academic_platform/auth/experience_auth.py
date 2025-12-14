# auth/experience_auth.py
from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from auth.country_institution_auth import CountryInstitutionAuth

router = APIRouter()
templates = Jinja2Templates(directory="templates")

class InstitutionLogin(BaseModel):
    country: str
    institution_code: str
    password: str

@router.get("/login", response_class=HTMLResponse)
async def immersive_login_page(request: Request):
    """صفحة دخول غامرة مع تأثيرات بصرية"""
    return templates.TemplateResponse("immersive_login.html", {
        "request": request,
        "countries": [
            {"code": "SA", "name": "🇸🇦 السعودية", "color": "#0d6e29"},
            {"code": "EG", "name": "🇪🇬 مصر", "color": "#ed1c24"}, 
            {"code": "AE", "name": "🇦🇪 الإمارات", "color": "#ffd900"}
        ]
    })

@router.post("/login-experience")
async def experience_login(login_data: InstitutionLogin):
    """دخول مع تجربة مستخدم فريدة"""
    # المصادقة المعتادة
    auth = CountryInstitutionAuth(db)
    admin = await auth.authenticate_admin(...)
    
    # إرجاع تجربة مخصصة
    return {
        "access_token": token,
        "welcome_animation": "courtroom_entrance",
        "personalized_greeting": f"مرحباً بك {admin.institution_name} 👨‍⚖️",
        "dashboard_theme": get_institution_theme(admin.country),
        "quick_stats": await get_quick_stats(admin),
        "daily_challenge": await get_daily_legal_challenge(admin)
    }