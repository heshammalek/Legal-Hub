# services/email_service.py
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from datetime import datetime, timedelta
import os
from typing import Optional

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.sender_email = os.getenv("SMTP_EMAIL")
        self.sender_password = os.getenv("SMTP_PASSWORD")
    
    async def send_subscription_notification(
        self, 
        to_email: str, 
        institution_name: str,
        notification_type: str,
        days_remaining: Optional[int] = None
    ):
        """إرسال إشعارات الاشتراك"""
        try:
            subject, body = self._prepare_notification_content(
                institution_name, notification_type, days_remaining
            )
            
            msg = MimeMultipart()
            msg['From'] = self.sender_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            msg.attach(MimeText(body, 'html', 'utf-8'))
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.sender_email, self.sender_password)
                server.send_message(msg)
            
            print(f"✅ تم إرسال إشعار {notification_type} إلى {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ فشل إرسال الإيميل: {e}")
            return False
    
    def _prepare_notification_content(
        self, 
        institution_name: str,
        notification_type: str,
        days_remaining: Optional[int] = None
    ):
        """تحضير محتوى الإشعار"""
        notifications = {
            "1month_before": {
                "subject": f"تنبيه: انتهاء اشتراك {institution_name} بعد 30 يوم",
                "body": f"""
                <div dir="rtl">
                    <h2>تنبيه انتهاء الاشتراك</h2>
                    <p>عزيزي مسؤول {institution_name},</p>
                    <p>يشرفنا خدمتكم في منصتنا التعليمية. نود إعلامكم أن اشتراك مؤسستكم سينتهي بعد <strong>30 يوم</strong>.</p>
                    <p>لضمان استمرارية الخدمة، يرجى تجديد الاشتراك في أقرب وقت ممكن.</p>
                    <br>
                    <p>مع خالص التحيات,<br>فريق المنصة التعليمية</p>
                </div>
                """
            },
            "1week_before": {
                "subject": f"تنبيه عاجل: انتهاء اشتراك {institution_name} بعد 7 أيام",
                "body": f"""
                <div dir="rtl">
                    <h2>تنبيه عاجل - انتهاء الاشتراك</h2>
                    <p>عزيزي مسؤول {institution_name},</p>
                    <p>نود تذكيركم أن اشتراك مؤسستكم سينتهي بعد <strong>7 أيام</strong> فقط.</p>
                    <p>سيتم تعطيل الوصول للخدمة في حال عدم التجديد.</p>
                    <br>
                    <p>مع خالص التحيات,<br>فريق المنصة التعليمية</p>
                </div>
                """
            },
            "expired": {
                "subject": f"إشعار: انتهاء اشتراك {institution_name}",
                "body": f"""
                <div dir="rtl">
                    <h2>انتهاء فترة الاشتراك</h2>
                    <p>عزيزي مسؤول {institution_name},</p>
                    <p>نود إعلامكم أن اشتراك مؤسستكم قد انتهى اليوم.</p>
                    <p>سيتم تعطيل الوصول للخدمة خلال <strong>أسبوع</strong> في حال عدم التجديد.</p>
                    <br>
                    <p>مع خالص التحيات,<br>فريق المنصة التعليمية</p>
                </div>
                """
            },
            "2weeks_after": {
                "subject": f"إشعار نهائي: تعطيل اشتراك {institution_name}",
                "body": f"""
                <div dir="rtl">
                    <h2>تعطيل الاشتراك</h2>
                    <p>عزيزي مسؤول {institution_name},</p>
                    <p>نأسف لإعلامكم أنه تم تعطيل اشتراك مؤسستكم بسبب عدم التجديد.</p>
                    <p>لإعادة التفعيل، يرجى التواصل مع فريق الدعم.</p>
                    <br>
                    <p>مع خالص التحيات,<br>فريق المنصة التعليمية</p>
                </div>
                """
            }
        }
        
        return (
            notifications[notification_type]["subject"],
            notifications[notification_type]["body"]
        )

email_service = EmailService()