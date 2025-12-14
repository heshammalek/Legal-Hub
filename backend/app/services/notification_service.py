# backend/app/services/notification_service.py
from typing import Dict, Any, List
from sqlmodel import Session, select
from datetime import datetime
import uuid
from app.models.judicialCase import JudicialCase 
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    
    @staticmethod
    def create_notification(
        db: Session,
        recipient_id: str,
        title: str,
        message: str,
        notification_type: str,
        lawyer_id: str = None,
        related_model: str = None,
        related_id: str = None
    ):
        """إنشاء إشعار جديد - النسخة المحدثة"""
        try:
            from app.models.notifications.notification_model import Notification
            
            notification = Notification(
                recipient_id=recipient_id,
                lawyer_id=lawyer_id,
                title=title,
                message=message,
                type=notification_type,
                status="unread",
                related_model=related_model,
                related_id=related_id,
                created_at=datetime.utcnow()
            )
            
            db.add(notification)
            db.commit()
            db.refresh(notification)
            
            logger.info(f"📢 تم إنشاء إشعار: {title} للمستخدم {recipient_id}")
            return notification
            
        except Exception as e:
            logger.error(f"❌ فشل في إنشاء الإشعار: {str(e)}", exc_info=True)
            db.rollback()
            return None

    @staticmethod
    def get_user_notifications(db: Session, user_id: str, limit: int = 50):
        """جلب إشعارات المستخدم"""
        try:
            from app.models.notifications.notification_model import Notification
            
            statement = select(Notification).where(
                Notification.recipient_id == user_id
            ).order_by(Notification.created_at.desc()).limit(limit)
            
            notifications = db.exec(statement).all()
            return notifications
            
        except Exception as e:
            logger.error(f"❌ فشل في جلب إشعارات المستخدم: {str(e)}")
            return []

    @staticmethod
    def get_unread_count(db: Session, user_id: str) -> int:
        """جلب عدد الإشعارات غير المقروءة"""
        try:
            from app.models.notifications.notification_model import Notification
            
            statement = select(Notification).where(
                Notification.recipient_id == user_id,
                Notification.status == "unread"
            )
            notifications = db.exec(statement).all()
            return len(notifications)
            
        except Exception as e:
            logger.error(f"❌ فشل في جلب عدد الإشعارات غير المقروءة: {str(e)}")
            return 0

    @staticmethod
    def mark_as_read(db: Session, notification_id: str, user_id: str):
        """تعليم إشعار كمقروء"""
        try:
            from app.models.notifications.notification_model import Notification
            
            notification = db.get(Notification, notification_id)
            if not notification or notification.recipient_id != user_id:
                return None
            
            notification.status = "read"
            notification.read_at = datetime.utcnow()
            db.add(notification)
            db.commit()
            db.refresh(notification)
            return notification
            
        except Exception as e:
            logger.error(f"❌ فشل في تعليم الإشعار كمقروء: {str(e)}")
            return None

    # ✅ دوال جديدة خاصة بالإنابة
    @staticmethod
    def notify_new_delegation(db: Session, delegation_request):
        """إشعار بطلب إنابة جديد"""
        try:
            # جلب جميع المحامين (في الواقع، يجب أن نرسل للمحامين في نفس المنطقة فقط)
            from app.models.user_models import LawyerProfile, UserProfile
            
            # جلب المحامين المتاحين
            lawyers = db.query(LawyerProfile).join(UserProfile).all()
            
            for lawyer in lawyers:
                # تجنب إرسال إشعار للمحامي نفسه
                if lawyer.id == delegation_request.requester_lawyer_id:
                    continue
                    
                NotificationService.create_notification(
                    db=db,
                    recipient_id=lawyer.profile.user_id,
                    title="طلب إنابة جديد",
                    message=f"طلب إنابة جديد في {delegation_request.court_name} - {delegation_request.circuit}",
                    notification_type="delegation_new",
                    lawyer_id=lawyer.id,
                    related_model="delegation",
                    related_id=str(delegation_request.id)
                )
            
            logger.info(f"📢 تم إرسال إشعارات بطلب إنابة جديد: {delegation_request.id}")
            
        except Exception as e:
            logger.error(f"❌ فشل في إرسال إشعارات الإنابة: {str(e)}")

    @staticmethod
    def notify_delegation_accepted(db: Session, delegation_request):
        """إشعار بقبول طلب الإنابة"""
        try:
            # إشعار للمحامي الطالب بأن طلبه تم قبوله
            from app.models.user_models import LawyerProfile
            
            requester_lawyer = db.query(LawyerProfile).filter(
                LawyerProfile.id == delegation_request.requester_lawyer_id
            ).first()
            
            if requester_lawyer:
                NotificationService.create_notification(
                    db=db,
                    recipient_id=requester_lawyer.profile.user_id,
                    title="تم قبول طلب الإنابة",
                    message=f"تم قبول طلب الإنابة في {delegation_request.court_name}",
                    notification_type="delegation_accepted",
                    lawyer_id=requester_lawyer.id,
                    related_model="delegation",
                    related_id=str(delegation_request.id)
                )
            
            logger.info(f"📢 تم إرسال إشعار بقبول الإنابة: {delegation_request.id}")
            
        except Exception as e:
            logger.error(f"❌ فشل في إرسال إشعار قبول الإنابة: {str(e)}")

    @staticmethod
    def notify_delegation_deleted(db: Session, delegation_id: str):
        """إشعار بحذف طلب الإنابة (بعد الاتفاق)"""
        try:
            # يمكن إضافة إشعارات إضافية هنا إذا لزم الأمر
            logger.info(f"📢 تم حذف طلب الإنابة: {delegation_id}")
            
        except Exception as e:
            logger.error(f"❌ فشل في إرسال إشعار حذف الإنابة: {str(e)}")


# تنبيهات متعلقة بالقضايا
class CaseNotificationService:
    
    def check_urgent_actions(self, case: JudicialCase) -> List[Dict[str, Any]]:
        """الكشف عن الإجراءات العاجلة"""
        notifications = []
        
        # التحقق من الجلسات القريبة
        for session in case.sessions:
            days_until = (session.date - datetime.now()).days
            if days_until == 1:
                notifications.append({
                    "type": "urgent",
                    "title": "جلسة غداً",
                    "message": f"جلسة قضية #{case.case_number} غداً",
                    "case_id": case.id,
                    "session_id": session.id,
                    "priority": "high"
                })
            elif days_until <= 3:
                notifications.append({
                    "type": "warning", 
                    "title": "جلسة قريبة",
                    "message": f"جلسة قضية #{case.case_number} خلال {days_until} أيام",
                    "case_id": case.id,
                    "session_id": session.id,
                    "priority": "medium"
                })
        
        # التحقق من المستندات المطلوبة
        pending_docs = self.get_pending_documents(case)
        if pending_docs:
            notifications.append({
                "type": "document",
                "title": "مستندات معلقة",
                "message": f"هناك {len(pending_docs)} مستندات معلقة في القضية #{case.case_number}",
                "case_id": case.id,
                "priority": "medium"
            })
        
        return notifications

    def get_pending_documents(self, case: JudicialCase) -> List[Any]:
        """الحصول على المستندات المعلقة"""
        # هذه دالة مساعدة - يمكن تنفيذها حسب الحاجة
        return []