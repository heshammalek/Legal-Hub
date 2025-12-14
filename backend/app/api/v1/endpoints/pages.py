from typing import List, Optional
from fastapi import APIRouter, status, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from app.database.connection import get_session
from app.utils.email import send_email, send_contact_notification
from app.models.user_models import ContactMessage
from app.core.config import settings
from app.database.crud import ContactCRUD

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/pages", tags=["pages"])

# نماذج البيانات (Pydantic)
class ServiceOut(BaseModel):
    id: int
    name: str
    description: str

class AchievementOut(BaseModel):
    id: int
    title: str
    detail: str

class ContactRequest(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    subject: str
    message: str
    contactMethod: str = "email"
    
    @field_validator('fullName')
    def validate_full_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('اسم المستخدم يجب أن يكون أكثر من حرفين')
        return v.strip()
    
    @field_validator('phone')
    def validate_phone(cls, v):
        # تنسيق رقم الهاتف المصري
        phone_digits = ''.join(filter(str.isdigit, v))
        if len(phone_digits) < 10:
            raise ValueError('رقم الهاتف غير صحيح')
        return v.strip()
    
    @field_validator('message')
    def validate_message(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('الرسالة يجب أن تكون أكثر من 10 أحرف')
        return v.strip()
    
    @field_validator('contactMethod')
    def validate_contact_method(cls, v):
        if v not in ['email', 'phone', 'both']:
            raise ValueError('طريقة التواصل غير صحيحة')
        return v

class ContactResponse(BaseModel):
    success: bool
    message: str
    contact_id: Optional[str] = None

# جلب قائمة الخدمات
@router.get("/services", response_model=List[ServiceOut])
async def list_services():
    return [
        ServiceOut(id=1, name="استشارة قانونية", description="خدمات استشارية في القانون التجاري."),
        ServiceOut(id=2, name="صياغة عقود", description="صياغة عقود احترافية ملزمة قانونياً.")
    ]

# جلب قائمة الإنجازات
@router.get("/achievements", response_model=List[AchievementOut])
async def list_achievements():
    return [
        AchievementOut(id=1, title="1000+ قضية منجزة", detail="أكثر من ألف قضية معتمدة."),
        AchievementOut(id=2, title="جائزة التميّز", detail="جائزة أفضل مكتب محاماة 2024.")
    ]

# إرسال رسالة تواصل
@router.post("/contact", response_model=ContactResponse)
async def submit_contact_form(
    contact_data: ContactRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session)
):
    """
    إرسال رسالة تواصل جديدة
    """
    try:
        # حفظ الرسالة في قاعدة البيانات
        contact_message = ContactMessage(
            full_name=contact_data.fullName,
            email=contact_data.email,
            phone=contact_data.phone,
            subject=contact_data.subject,
            message=contact_data.message,
            contact_method=contact_data.contactMethod,
            status="new",
            created_at=datetime.utcnow()
        )
        
        db.add(contact_message)
        db.commit()
        db.refresh(contact_message)
        
        # إرسال إيميل تأكيد للعميل في الخلفية
        background_tasks.add_task(
            send_contact_confirmation_email,
            contact_data.email,
            contact_data.fullName,
            contact_data.subject
        )
        
        # إرسال إشعار للإدارة في الخلفية
        background_tasks.add_task(
            send_admin_notification,
            contact_message.id,
            contact_data
        )
        
        logger.info(f"تم استلام رسالة جديدة من {contact_data.fullName} - {contact_data.email}")
        
        return ContactResponse(
            success=True,
            message="تم إرسال رسالتك بنجاح! سنتواصل معك في أقرب وقت ممكن.",
            contact_id=contact_message.id
        )
        
    except Exception as e:
        logger.error(f"خطأ في إرسال رسالة التواصل: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً."
        )

# إرسال إيميل تأكيد للعميل
async def send_contact_confirmation_email(email: str, name: str, subject: str):
    """إرسال إيميل تأكيد للعميل"""
    try:
        email_subject = "تأكيد استلام رسالتك - Legal Hub"
        
        email_body = f"""
        <div dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Legal Hub</h1>
                <p style="color: #e0e7ff; margin: 10px 0 0 0;">منصة الحلول القانونية</p>
            </div>
            
            <div style="padding: 30px;">
                <h2 style="color: #1e40af; margin-bottom: 20px;">مرحباً {name}</h2>
                
                <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                    شكراً لتواصلك معنا! تم استلام رسالتك بنجاح وسنقوم بالرد عليك في أقرب وقت ممكن.
                </p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #374151; margin-top: 0;">تفاصيل رسالتك:</h3>
                    <p style="margin: 5px 0;"><strong>الموضوع:</strong> {subject}</p>
                    <p style="margin: 5px 0;"><strong>تاريخ الإرسال:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
                </div>
                
                <p style="color: #4b5563; line-height: 1.6;">
                    سيتم الرد على رسالتك خلال 24 ساعة كحد أقصى. إذا كان لديك أي استفسار عاجل، يمكنك التواصل معنا مباشرة على:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <p style="margin: 10px 0;">📞 +20 123 456 7890</p>
                    <p style="margin: 10px 0;">✉️ info@legalhub.com</p>
                </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    © 2025 Legal Hub. جميع الحقوق محفوظة.
                </p>
            </div>
        </div>
        """
        
        await send_email(
            to_email=email,
            subject=email_subject,
            html_content=email_body
        )
        
    except Exception as e:
        logger.error(f"فشل في إرسال إيميل التأكيد: {str(e)}")

# إرسال إشعار للإدارة
async def send_admin_notification(contact_id: int, contact_data: ContactRequest):
    """إرسال إشعار للإدارة برسالة جديدة"""
    try:
        admin_subject = f"رسالة جديدة من {contact_data.fullName} - Legal Hub"
        
        admin_body = f"""
        <div style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">إشعار رسالة جديدة</h1>
            </div>
            
            <div style="padding: 30px; background-color: #ffffff;">
                <h2 style="color: #dc2626;">تفاصيل الرسالة:</h2>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>رقم الرسالة:</strong> {contact_id}</p>
                    <p><strong>الاسم:</strong> {contact_data.fullName}</p>
                    <p><strong>البريد الإلكتروني:</strong> {contact_data.email}</p>
                    <p><strong>الهاتف:</strong> {contact_data.phone}</p>
                    <p><strong>الموضوع:</strong> {contact_data.subject}</p>
                    <p><strong>طريقة التواصل المفضلة:</strong> {contact_data.contactMethod}</p>
                    <p><strong>تاريخ الإرسال:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                </div>
                
                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px;">
                    <h3 style="margin-top: 0;">الرسالة:</h3>
                    <p style="line-height: 1.6;">{contact_data.message}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <p style="color: #ef4444; font-weight: bold;">يرجى الرد على هذه الرسالة في أقرب وقت ممكن</p>
                </div>
            </div>
        </div>
        """
        
        await send_contact_notification(
            subject=admin_subject,
            html_content=admin_body
        )
        
    except Exception as e:
        logger.error(f"فشل في إرسال إشعار الإدارة: {str(e)}")

#########################################################################################

@router.post("/contact")
def submit_contact(data: dict, session: Session = Depends(get_session)):
    saved = ContactCRUD.save_message(session, data)
    return {
        "success": True,
        "message": "تم استلام رسالتك بنجاح",
        "data": {"id": saved.id}
    }

