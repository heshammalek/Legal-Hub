# services/subscription_service.py
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database.models import InstitutionAdmin
from services.email_service import email_service
import asyncio

class SubscriptionService:
    async def check_and_notify_subscriptions(self, db: AsyncSession):
        """التحقق من الاشتراكات وإرسال الإشعارات"""
        print("🔄 البدء في فحص الاشتراكات...")
        
        # جلب جميع المؤسسات النشطة
        result = await db.execute(
            select(InstitutionAdmin).where(InstitutionAdmin.is_active == True)
        )
        active_institutions = result.scalars().all()
        
        notifications_sent = 0
        
        for institution in active_institutions:
            if institution.subscription_end:
                notifications = await self._check_institution_subscription(institution, db)
                notifications_sent += notifications
        
        print(f"✅ تم إرسال {notifications_sent} إشعار")
        return notifications_sent
    
    async def _check_institution_subscription(self, institution: InstitutionAdmin, db: AsyncSession):
        """التحقق من اشتراك مؤسسة محددة"""
        now = datetime.utcnow()
        days_remaining = (institution.subscription_end - now).days
        
        notifications_sent = 0
        
        # قبل 30 يوم
        if 25 <= days_remaining <= 35 and not institution.notification_sent_1month:
            if await email_service.send_subscription_notification(
                institution.email, institution.name, "1month_before", days_remaining
            ):
                institution.notification_sent_1month = True
                notifications_sent += 1
        
        # قبل 7 أيام
        elif 5 <= days_remaining <= 10 and not institution.notification_sent_1week:
            if await email_service.send_subscription_notification(
                institution.email, institution.name, "1week_before", days_remaining
            ):
                institution.notification_sent_1week = True
                notifications_sent += 1
        
        # انتهى الاشتراك
        elif days_remaining <= 0 and not institution.notification_sent_expired:
            if await email_service.send_subscription_notification(
                institution.email, institution.name, "expired"
            ):
                institution.notification_sent_expired = True
                notifications_sent += 1
        
        # بعد أسبوعين من الانتهاء - تعطيل المؤسسة
        elif days_remaining <= -14 and not institution.notification_sent_2weeks_after:
            if await email_service.send_subscription_notification(
                institution.email, institution.name, "2weeks_after"
            ):
                institution.notification_sent_2weeks_after = True
                institution.is_active = False  # تعطيل المؤسسة
                notifications_sent += 1
                print(f"🚫 تم تعطيل مؤسسة {institution.name}")
        
        if notifications_sent > 0:
            await db.commit()
        
        return notifications_sent
    
    async def create_institution_subscription(
        self, 
        institution_data: dict, 
        db: AsyncSession,
        subscription_months: int = 12  # افتراضي سنة
    ):
        """إنشاء اشتراك جديد لمؤسسة"""
        subscription_end = datetime.utcnow() + timedelta(days=subscription_months * 30)
        
        institution = InstitutionAdmin(
            **institution_data,
            subscription_start=datetime.utcnow(),
            subscription_end=subscription_end,
            is_active=False  # بتكون غير نشطة حتى يتم التفعيل
        )
        
        db.add(institution)
        await db.commit()
        await db.refresh(institution)
        
        # إرسال إيميل ترحيبي
        await email_service.send_subscription_notification(
            institution.email, 
            institution.name, 
            "welcome", 
            subscription_months * 30
        )
        
        return institution

subscription_service = SubscriptionService()