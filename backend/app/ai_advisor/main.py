import asyncio
import logging
from fastapi import FastAPI
from contextlib import asynccontextmanager
import uvicorn
import os
# في main.py - أضف في الأعلى:
from dotenv import load_dotenv
load_dotenv()  # ⬅️ هذه السطر يحل المشكلة


# استيراد الراوتر الرئيسي للـ API والاعتماديات
from .api import main_api_router
from .api.dependencies import initialize_ai_services, get_cache_manager, get_semantic_retriever

# إعداد الـ logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    مدير دورة حياة التطبيق (Lifespan).
    """
    logger.info("... بدء تشغيل خدمة AI Advisor ...")
    
    # --- بدء التشغيل ---
    try:
        # 🆕 تحقق وإصلاح AI_DATABASE_URL إذا كان فيه مشكلة
        ai_db_url = os.getenv("AI_DATABASE_URL")
        logger.info(f"🔍 AI_DATABASE_URL الحالي: {ai_db_url}")
        
        if not ai_db_url or "user:pass" in str(ai_db_url):
            logger.warning("⚠️  AI_DATABASE_URL غير مضبوط - استخدام القيمة الصحيحة...")
            os.environ['AI_DATABASE_URL'] = 'postgresql+asyncpg://postgres:123456@localhost:5432/legal_ai'
            logger.info("✅ تم ضبط AI_DATABASE_URL: postgresql+asyncpg://postgres:123456@localhost:5432/legal_ai")
        
        ai_services = await initialize_ai_services()
        logger.info("✅ اكتملت تهيئة الخدمات الأساسية بنجاح.")
        
        # 🆕 نظام اكتساب البيانات (إضافة آمنة)
        try:
            from app.data_acquisition.auto_ingestion_service import AutoIngestionService
            
            rag_retriever = ai_services.get("rag_retriever")
            if rag_retriever:
                auto_ingestion = AutoIngestionService(rag_retriever)
                asyncio.create_task(auto_ingestion.start_auto_ingestion())
                logger.info("🚀 نظام اكتساب البيانات الذكي يعمل في الخلفية...")
            else:
                logger.warning("⚠️ RAG retriever غير متوفر - تأجيل نظام الاكتساب")
                
        except ImportError as e:
            logger.warning("⚠️ نظام اكتساب البيانات غير مثبت - المتابعة بدونها")
        except Exception as e:
            logger.error(f"⚠️ فشل بدء نظام الاكتساب: {e} - المتابعة بدونها")
            
    except Exception as e:
        logger.error(f"⚠️  فشل في تهيئة خدمات الذكاء الاصطناعي: {e}")
        logger.info("🔄 المتابعة بدون خدمات الذكاء الاصطناعي...")
    
    yield
    
    # --- إيقاف التشغيل ---
    logger.info("... بدء إيقاف تشغيل خدمة AI Advisor ...")
    try:
        cache = get_cache_manager()
        await cache.close()
        
        retriever = get_semantic_retriever(None, None)
        if retriever.vector_db.pool:
            await retriever.vector_db.pool.close()
            
        logger.info("✅ تم إغلاق الاتصالات (Redis & DB) بنجاح.")
    except Exception as e:
        logger.error(f"❌ خطأ أثناء إيقاف التشغيل: {e}")

# إنشاء تطبيق FastAPI
app = FastAPI(
    title="Legal Hub - AI Advisor Service",
    description="خدمة مصغرة (Microservice) للذكاء الاصطناعي القانوني (RAG، ترجمة، تحليل).",
    version="1.0.0",
    lifespan=lifespan # (استخدام مدير دورة الحياة الجديد)
)

# تضمين الراوتر الرئيسي للـ API
app.include_router(main_api_router, prefix="/ai-advisor")

@app.get("/ai-advisor/health", tags=["Health"])
async def health_check():
    """نقطة نهاية للتحقق من أن الخدمة تعمل."""
    return {"status": "ok", "service": "ai_advisor"}

# --- كيفية التشغيل ---
if __name__ == "__main__":
    """
    لتشغيل هذا الخادم بشكل مستقل (للتطوير):
    (من مجلد backend)
    uvicorn app.ai_advisor.main:app --reload --port 8001
    """
    uvicorn.run(
        "app.ai_advisor.main:app", 
        host=os.getenv("AI_HOST", "127.0.0.1"), 
        port=int(os.getenv("AI_PORT", 8001)), 
        reload=True
    )