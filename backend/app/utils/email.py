# backend/app/utils/email.py

import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
from datetime import datetime
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

load_dotenv()

def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """
    دالة عامة لإرسال رسالة HTML لأي مستلم
    """
    sender_email = settings.SMTP_USERNAME or os.getenv("SMTP_USERNAME")
    app_password = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD")
    smtp_server = settings.SMTP_SERVER or "smtp.gmail.com"
    smtp_port = settings.SMTP_PORT or 465

    if not sender_email or not app_password:
        logger.error("❌ SMTP not configured. Check SMTP_USERNAME and SMTP_PASSWORD in .env")
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = to_email
    msg.set_content("Please view this email in HTML format.")
    msg.add_alternative(html_content, subtype="html")

    try:
        if smtp_port == 465:
            smtp = smtplib.SMTP_SSL(smtp_server, smtp_port)
        else:
            smtp = smtplib.SMTP(smtp_server, smtp_port)
            smtp.starttls()

        smtp.login(sender_email, app_password)
        smtp.send_message(msg)
        smtp.quit()
        logger.info(f"✅ Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
        return False


def send_consultation_accepted_email(
    user_email: str, 
    user_name: str, 
    subject: str, 
    scheduled_time: str, 
    zoom_link: str, 
    password: str
):
    """إرسال email عند قبول الاستشارة"""
    html = f"""
    <html dir="rtl">
    <body style="font-family: Arial; text-align: right; padding: 20px;">
        <div style="background: #f0f9ff; padding: 20px; border-radius: 10px;">
            <h2 style="color: #0369a1;">مرحباً {user_name}</h2>
            <p style="font-size: 16px;">تم قبول طلب الاستشارة الخاص بك: <strong>{subject}</strong></p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #059669;">تفاصيل الاجتماع:</h3>
                <ul style="line-height: 2;">
                    <li><strong>التاريخ والوقت:</strong> {scheduled_time}</li>
                    <li><strong>رابط الاجتماع:</strong> <a href="{zoom_link}" style="color: #2563eb;">{zoom_link}</a></li>
                    <li><strong>كلمة المرور:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px;">{password}</code></li>
                </ul>
            </div>
            
            <p style="color: #dc2626; font-weight: bold;">⚠️ يرجى الحضور قبل الموعد بـ 5 دقائق</p>
        </div>
    </body>
    </html>
    """
    send_email(user_email, f"✅ تم قبول استشارتك: {subject}", html)


def send_consultation_rejected_email(
    user_email: str, 
    user_name: str, 
    lawyer_name: str, 
    subject: str, 
    reason: str
):
    """إرسال email عند رفض الاستشارة"""
    html = f"""
    <html dir="rtl">
    <body style="font-family: Arial; text-align: right; padding: 20px;">
        <div style="background: #fef2f2; padding: 20px; border-radius: 10px;">
            <h2 style="color: #991b1b;">مرحباً {user_name}</h2>
            <p style="font-size: 16px;">
                نأسف لإبلاغك أن المحامي <strong>{lawyer_name}</strong> 
                اعتذر عن قبول طلب الاستشارة: <strong>{subject}</strong>
            </p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #dc2626;">سبب الاعتذار:</h3>
                <p style="line-height: 1.8;">{reason}</p>
            </div>
            
            <p style="color: #059669; font-weight: bold;">
                💡 يمكنك طلب استشارة من محامي آخر من خلال لوحة التحكم
            </p>
        </div>
    </body>
    </html>
    """
    send_email(user_email, f"❌ اعتذار عن الاستشارة: {subject}", html)


def send_contact_notification(subject: str, html_content: str) -> bool:
    """إرسال إشعار للإدارة برسائل التواصل"""
    admin_email = os.getenv("ADMIN_EMAIL", "info@legalhub.com")
    return send_email(admin_email, subject, html_content)


def send_password_reset_otp(user_email: str, user_name: str, otp_code: str) -> bool:
    """إرسال OTP خاص بتغيير كلمة المرور (دالة جديدة)"""
    
    html = f"""
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: right; padding: 0; margin: 0; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔐 تغيير كلمة المرور</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
                <h2 style="color: #333; margin-top: 0;">مرحباً {user_name}</h2>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    لقد طلبت تغيير كلمة المرور لحسابك في نظام LegalHub.
                    استخدم رمز التحقق أدناه لإكمال العملية:
                </p>
                
                <!-- OTP Code -->
                <div style="text-align: center; margin: 40px 0;">
                    <div style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #dc2626; 
                                background: #fef2f2; padding: 25px; border-radius: 12px; display: inline-block;
                                border: 2px dashed #dc2626;">
                        {otp_code}
                    </div>
                </div>
                
                <!-- Instructions -->
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-right: 4px solid #3b82f6;">
                    <h3 style="color: #1e40af; margin-top: 0;">🛡️ معلومات أمنية</h3>
                    <ul style="color: #4b5563; line-height: 1.8; padding-right: 15px;">
                        <li>هذا الرمز ساري لمدة <strong>10 دقائق</strong> فقط</li>
                        <li>لا تشارك هذا الرمز مع أي شخص</li>
                        <li>إذا لم تطلب هذا الإجراء، يرجى تجاهل هذه الرسالة</li>
                    </ul>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px; margin: 0;">
                    فريق الدعم - LegalHub<br>
                    <a href="mailto:support@legalhub.com" style="color: #3b82f6;">support@legalhub.com</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    success = send_email(
        user_email, 
        "🔐 رمز التحقق - تغيير كلمة المرور - LegalHub", 
        html
    )
    
    if success:
        logger.info(f"✅ Password reset OTP sent to {user_email}")
    else:
        logger.error(f"❌ Failed to send password reset OTP to {user_email}")
    
    return success


def send_password_change_success(user_email: str, user_name: str) -> bool:
    """إرسال تأكيد نجاح تغيير كلمة المرور (دالة جديدة)"""
    
    html = f"""
    <html dir="rtl">
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: right; padding: 20px; background: #f0fdf4;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid #22c55e;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; color: #22c55e;">✅</div>
                <h1 style="color: #166534; margin: 10px 0;">تم تغيير كلمة المرور بنجاح</h1>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                مرحباً <strong>{user_name}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
                تم تغيير كلمة المرور لحسابك في نظام LegalHub بنجاح.
            </p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #22c55e;">
                <h3 style="color: #166534; margin-top: 0;">🔒 معلومات الأمان</h3>
                <ul style="color: #15803d; line-height: 1.8;">
                    <li>كلمة المرور الجديدة مفعلة الآن</li>
                    <li>تم تسجيل الخروج من جميع الأجهزة</li>
                    <li>إذا لم تقم بهذا التغيير، يرجى التواصل مع الدعم فوراً</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                    LegalHub - نظام المحاماة الذكي<br>
                    {datetime.now().strftime('%Y-%m-%d %H:%M')}
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    success = send_email(
        user_email,
        "✅ تم تغيير كلمة المرور بنجاح - LegalHub",
        html
    )
    
    if success:
        logger.info(f"✅ Password change confirmation sent to {user_email}")
    
    return success


async def send_security_alert(email: str, user_name: str, alert_type: str):
    """إرسال تنبيه أمني"""
    subject = "🔒 تنبيه أمني - LegalHub"
    body = f"""
    <div style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px;">⚠️ تنبيه أمني</h1>
            </div>
            <div style="padding: 30px;">
                <h2 style="color: #333;">مرحباً {user_name},</h2>
                <p style="color: #666; line-height: 1.6;">
                    تم اكتشاف نشاط غير معتاد على حسابك:
                    <strong style="color: #ff6b6b;">{alert_type}</strong>
                </p>
                <div style="background: #fff5f5; border: 1px solid #ff6b6b; border-radius: 10px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #c53030;">
                        إذا لم تكن أنت من قام بهذا الإجراء، يرجى تغيير كلمة المرور فوراً.
                    </p>
                </div>
                <p style="color: #666;">
                    مع تحيات فريق LegalHub
                </p>
            </div>
        </div>
    </div>
    """
    await send_email(email, subject, body)