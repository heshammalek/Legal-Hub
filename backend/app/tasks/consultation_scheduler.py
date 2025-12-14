from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.models.requests.consultation_request import ConsultationRequest, ConsultationStatus
from app.database.connection import engine

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', minutes=5)
def check_upcoming_consultations():
    """
    فحص الاستشارات القادمة كل 5 دقائق
    """
    with Session(engine) as session:
        now = datetime.utcnow()
        thirty_mins_later = now + timedelta(minutes=30)
        
        # جلب الاستشارات التي ستبدأ خلال 30 دقيقة
        upcoming = session.exec(
            select(ConsultationRequest).where(
                ConsultationRequest.status == ConsultationStatus.ACCEPTED,
                ConsultationRequest.scheduled_time.between(now, thirty_mins_later),
                ConsultationRequest.is_notified == False
            )
        ).all()
        
        for consultation in upcoming:
            # إرسال تنبيه
            print(f"🔔 تنبيه: الاجتماع {consultation.id} سيبدأ خلال 30 دقيقة!")
            # TODO: إرسال web push notification
            
            # تحديث حالة الإشعار
            consultation.is_notified = True
            session.add(consultation)
        
        session.commit()
        print(f"✅ Checked {len(upcoming)} upcoming consultations")


@scheduler.scheduled_job('interval', hours=1)
def cancel_expired_consultations():
    """
    إلغاء الاستشارات التي تجاوز موعدها (بعد ساعة من الموعد)
    """
    with Session(engine) as session:
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        
        expired = session.exec(
            select(ConsultationRequest).where(
                ConsultationRequest.status == ConsultationStatus.ACCEPTED,
                ConsultationRequest.scheduled_time < one_hour_ago
            )
        ).all()
        
        for consultation in expired:
            consultation.status = ConsultationStatus.CANCELLED
            session.add(consultation)
            print(f"⏰ تم إلغاء الاستشارة {consultation.id} (انتهى موعدها)")
        
        session.commit()
        print(f"✅ Cancelled {len(expired)} expired consultations")


# ✅ اختبار عند بدء التشغيل
@scheduler.scheduled_job('interval', seconds=10)
def test_scheduler():
    """
    اختبار أن الـ scheduler يعمل (يطبع كل 10 ثواني)
    """
    print(f"⏰ Scheduler is running at {datetime.now().strftime('%H:%M:%S')}")