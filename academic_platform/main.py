from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os

# استيراد الميدلوير مرة واحدة فقط
from auth.subscription_middleware import check_subscription_middleware

from auth.country_institution_auth import CountryInstitutionAuth
from database.models import InstitutionAdmin
#from database.seed_data import check_sample_data, create_sample_data
from database.connection import create_tables, get_db
from auth.admin_dashboard_auth import router as auth_router
from config.settings import settings

from institution_admin.dashboard import router as dashboard_router
from institution_admin.group_management import router as groups_router
from institution_admin.student_management import router as students_router
from institution_admin.teacher_management import router as teachers_router
from learning.content_management import router as content_router
from learning.assessment_engine import router as assessment_router
from learning.court_simulation import router as simulation_router  
from analytics.performance_reports import router as reports_router
from auth.experience_auth import router as experience_auth_router
from institution_admin.immersive_dashboard import router as immersive_dashboard_router
from gamification.engagement_system import router as gamification_router
from experience.personalization import router as personalization_router

# 🔄 الجديدة - أضف هذه الاستيرادات
from auth.teacher_permissions import auth_router as teacher_auth_router
from institution_admin.case_management import router as case_management_router
from auth.institution_registration import router as institution_registration_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🔄 بدء تهيئة منصة التعلم الأكاديمية...")
    try:
        from database.connection import create_tables
        await create_tables()
        print("✅ تم إنشاء الجداول بنجاح")
        
        # إضافة البيانات التجريبية
#        async for db in get_db():
#            await create_sample_data(db)
#            await check_sample_data(db)
#            break
            
    except Exception as e:
        print(f"⚠️  خطأ في التهيئة: {e}")
    
    yield
    
    # Shutdown
    print("⏹️ إيقاف المنصة...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# 🔥 أضف الميدلوير هنا - كان ناقص!
#app.middleware("http")(check_subscription_middleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # أضفت 127.0.0.1
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📍 Routes الحالية - بدون تعديل
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(dashboard_router, prefix="/api/admin", tags=["Admin Dashboard"])
app.include_router(groups_router, prefix="/api/admin", tags=["Group Management"])
app.include_router(students_router, prefix="/api/admin", tags=["Student Management"])
app.include_router(teachers_router, prefix="/api/admin", tags=["Teacher Management"])
app.include_router(content_router, prefix="/api/admin", tags=["Educational Content"])
app.include_router(assessment_router, prefix="/api/admin", tags=["Assessment Engine"])
app.include_router(simulation_router, prefix="/api/admin", tags=["Court Simulation"])
app.include_router(reports_router, prefix="/api/admin", tags=["Analytics & Reports"])
app.include_router(experience_auth_router, prefix="/api/experience", tags=["Immersive Experience"])
app.include_router(immersive_dashboard_router, prefix="/api/experience", tags=["Dashboard Experience"])
app.include_router(gamification_router, prefix="/api/gamification", tags=["Gamification"])
app.include_router(personalization_router, prefix="/api/user", tags=["Personalization"])

# 🆕 Routes الجديدة - أضف هذه السطور
app.include_router(teacher_auth_router, prefix="/api/auth", tags=["Teacher Auth"])
app.include_router(case_management_router, prefix="/api/teacher", tags=["Case Management"])
app.include_router(institution_registration_router, prefix="/api/auth", tags=["Institution Registration"])

# 🎯 endpoints الأساسية
@app.get("/")
async def root():
    return {"message": "منصة التعلم الأكاديمية تعمل بنجاح! 🎓"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "academic_platform"}