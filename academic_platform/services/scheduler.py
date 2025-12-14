# services/scheduler.py
import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from academic_platform.database.seed_data import check_sample_data, create_sample_data
from database.connection import create_tables, get_db
from services.subscription_service import subscription_service

scheduler = AsyncIOScheduler()

async def daily_subscription_check():
    """مهمة يومية للتحقق من الاشتراكات"""
    print("🕒 بدء الفحص اليومي للاشتراكات...")
    async for db in get_db():
        try:
            await subscription_service.check_and_notify_subscriptions(db)
            break
        except Exception as e:
            print(f"❌ خطأ في الفحص اليومي: {e}")

def start_scheduler():
    """بدء المهمات المجدولة"""
    scheduler.add_job(
        daily_subscription_check,
        CronTrigger(hour=9, minute=0),  # الساعة 9 صباحاً كل يوم
        id="daily_subscription_check"
    )
    scheduler.start()
    print("✅ تم بدء المهمات المجدولة")

# في main.py أضف:
from services.scheduler import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🔄 بدء تهيئة منصة التعلم الأكاديمية...")
    try:
        await create_tables()
        print("✅ تم إنشاء الجداول بنجاح")
        
        # بدء المهمات المجدولة
        start_scheduler()
        
        async for db in get_db():
            await create_sample_data(db)
            await check_sample_data(db)
            break
            
    except Exception as e:
        print(f"⚠️  خطأ في التهيئة: {e}")
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    print("⏹️ إيقاف المنصة...")