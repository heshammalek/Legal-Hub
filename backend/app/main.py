# في main.py، احذف كل login/signup endpoints واتركها لـ auth.py فقط:

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1.auth import me

# Imports
from app.database.connection import create_db_and_tables
from app.core.config import settings
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.pages import router as pages_router
from app.api.v1.endpoints.user import router as user_router
from app.api.v1 import api_router
from fastapi.staticfiles import StaticFiles
from app.api.v1.endpoints import lawyer, consultations, delegation, agenda
from contextlib import asynccontextmanager
from app.tasks.consultation_scheduler import scheduler
from app.api.v1.endpoints import delegation, ai_legal
from app.api.v1.endpoints import documents, ai_generation 
from app.tasks.agenda_scheduler import scheduler    
from app.api.v1.endpoints import notifications
from app.api.v1.endpoints import cases
from app.api.v1.endpoints import discussions
from app.api.v1.endpoints import subscriptions  
from app.api.v1.endpoints.ai_proxy import router as ai_proxy_router
from app.ai_advisor.database.ai_database import create_ai_tables, close_ai_connection
from app.data_acquisition.api.endpoints import router as data_acquisition_router
#from app.court_simulation.api.endpoints import router as court_simulation_router 



@asynccontextmanager
async def lifespan(app: FastAPI):

########################################################################
    # ✅ تهيئة قاعدة بيانات الذكاء الاصطناعي عند البدء
    print("🔄 تهيئة اتصال قاعدة بيانات الذكاء الاصطناعي...")
    await create_ai_tables()  # للتأكد من وجود الجداول
    print("✅ اتصال قاعدة بيانات الذكاء الاصطناعي جاهز")
    
    yield  # التطبيق يعمل هنا
    
    # ✅ إغلاق الاتصال عند التوقف
    print("🔌 إغلاق اتصال قاعدة بيانات الذكاء الاصطناعي...")
    await close_ai_connection()
    print("✅ اتصال قاعدة بيانات الذكاء الاصطناعي مغلق")

###########################################################################

    print("INFO: Starting up and creating database tables...")
    create_db_and_tables()

    # ✅ تشغيل Scheduler
    scheduler.start()
    print("✅ Consultation scheduler started")
    
    yield

    # Shutdown
    scheduler.shutdown()
    print("⏹️ Consultation scheduler stopped")
    print("INFO: Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    debug=True # تحذف ف الانتاج
)






app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Legal Hub API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}


# Static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Include all routers

app.include_router(lawyer.router, prefix="/api/lawyer", tags=["lawyer"])
app.include_router(consultations.router, prefix="/api/v1", tags=["consultations"])
app.include_router(auth_router)      # سيضيف /api/v1/auth/login و /signup و /logout
app.include_router(pages_router)     # الصفحات العامة
app.include_router(user_router)      # /api/v1/users/dashboard
app.include_router(delegation.router, prefix="/api/v1/delegation", tags=["delegation"])
app.include_router(api_router, prefix="/api/v1")
app.include_router(me.router,prefix="/api",tags=["auth"])
app.include_router(ai_legal.router, prefix="/api/v1/ai", tags=["AI Legal"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(ai_generation.router, prefix="/api/v1/ai", tags=["ai-generation"])
app.include_router(agenda.router, prefix="/api/v1/agenda", tags=["agenda"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(cases.router, prefix="/api/v1/cases", tags=["cases"])
app.include_router(discussions.router, prefix="/api/v1/discussions", tags=["discussions"])
app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["subscriptions"])
app.include_router(ai_proxy_router, prefix="/api/v1", tags=["AI Proxy"])
app.include_router(data_acquisition_router, prefix="/api/v1/data-acquisition", tags=["data-acquisition"])
#app.include_router(court_simulation_router, prefix="/api/v1/court_simulation", tags=["court-simulation"])
