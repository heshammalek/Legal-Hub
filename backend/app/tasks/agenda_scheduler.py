# backend/app/tasks/agenda_scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session, select
from datetime import datetime, timedelta
import logging

from app.database.connection import get_session
from app.models.agenda_models import Event
from app.services.notification_service import NotificationService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_upcoming_events():
    """
    التحقق من الأحداث القريبة وإرسال تذكيرات
    """
    logger.info("🔄 المخطط يعمل: التحقق من الأحداث القادمة...")
    
    try:
        with next(get_session()) as db:
            now = datetime.utcnow()
            
            # الأحداث التي تبدأ في الـ 30 دقيقة القادمة ولم نرسل لها تذكير
            upcoming_time = now + timedelta(minutes=30)
            
            statement = select(Event).where(
                Event.start_time.between(now, upcoming_time)
            )
            
            upcoming_events = db.exec(statement).all()
            logger.info(f"📅 تم العثور على {len(upcoming_events)} حدث قادم")
            
            for event in upcoming_events:
                logger.info(f"🔔 إرسال تذكير للحدث: {event.title} (ID: {event.id})")
                
                # إرسال التذكير
                NotificationService.send_agenda_reminder(db=db, event=event)
                
            logger.info("✅ تم إرسال جميع التذكيرات")
            
    except Exception as e:
        logger.error(f"❌ خطأ في المخطط: {str(e)}")

# إعداد المخطط
scheduler = BackgroundScheduler()
# تشغيل المهمة كل 5 دقائق
scheduler.add_job(check_upcoming_events, 'interval', minutes=5, id="agenda_reminder_job")

def start_scheduler():
    """بدء تشغيل المخطط"""
    if not scheduler.running:
        scheduler.start()
        logger.info("🚀 بدأ تشغيل مخطط تذكيرات الأجندة")
    else:
        logger.info("ℹ️ المخطط يعمل بالفعل")

def stop_scheduler():
    """إيقاف المخطط"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("🛑 تم إيقاف مخطط تذكيرات الأجندة")