# backend/app/api/v1/endpoints/emergency.py

from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from sqlmodel import Session, select, or_
from datetime import datetime, timedelta
from typing import Optional
import os
import uuid
import aiofiles

from app.database.connection import get_session
from app.core.security import get_current_active_user
from app.models.user_models import User, LawyerProfile, UserProfile
from app.models.requests.emergency_request import (
    EmergencyLawyerRequest,
    LawyerContactInfo
)
from app.services.notification_service import NotificationService 



router = APIRouter(tags=["Emergency"])

VOICE_NOTES_DIR = "uploads/voice_notes"
os.makedirs(VOICE_NOTES_DIR, exist_ok=True)

@router.post("/emergency-request")
async def create_emergency_request(
    description: str = Form(...),
    user_latitude: float = Form(...),
    user_longitude: float = Form(...),
    user_location_name: Optional[str] = Form(None),
    preferred_specialization: Optional[str] = Form(None),
    priority: str = Form("high"),
    contact_phone: Optional[str] = Form(None),
    contact_method: str = Form("app"),
    user_notes: Optional[str] = Form(None),
    preferred_lawyer_id: Optional[str] = Form(None),
    voice_note: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """إنشاء طلب محامي طوارئ موجه لمحامٍ محدد"""
    
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    voice_note_filename = None
    voice_note_url = None
    voice_note_duration = None
    
    if voice_note:
        file_extension = voice_note.filename.split('.')[-1] if '.' in voice_note.filename else 'webm'
        voice_note_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(VOICE_NOTES_DIR, voice_note_filename)
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await voice_note.read()
            await f.write(content)
        
        voice_note_url = f"/uploads/voice_notes/{voice_note_filename}"
    
    emergency_request = EmergencyLawyerRequest(
        user_id=current_user.id,
        description=description,
        user_latitude=user_latitude,
        user_longitude=user_longitude,
        user_location_name=user_location_name,
        preferred_specialization=preferred_specialization,
        priority=priority,
        contact_phone=contact_phone,
        contact_method=contact_method,
        user_notes=user_notes,
        preferred_lawyer_id=preferred_lawyer_id,
        voice_note_filename=voice_note_filename,
        voice_note_url=voice_note_url,
        voice_note_duration=voice_note_duration,
        expires_at=expires_at,
        status="pending"
    )
    
    session.add(emergency_request)
    session.commit()
    session.refresh(emergency_request)
    
  # ✅ إنشاء إشعار للمحامين المتاحين
    try:
        # جلب المحامين المتاحين للطوارئ
        available_lawyers = session.exec(
            select(LawyerProfile).where(
                LawyerProfile.emergency_available == True,
                LawyerProfile.membership_status == "active"
            )
        ).all()
        
        for lawyer in available_lawyers:
            # الحصول على user_id للمحامي
            lawyer_profile = session.get(UserProfile, lawyer.profile_id)
            if lawyer_profile:
                NotificationService.create_notification(
                    db=session,
                    recipient_id=lawyer_profile.user_id,
                    title="طلب طوارئ جديد 🚨",
                    message=f"طلب طوارئ في {user_location_name or 'موقع قريب'} - {description[:50]}...",
                    notification_type="emergency_request",
                    lawyer_id=lawyer.id,
                    related_model="emergency_request",
                    related_id=emergency_request.id
                )
                print(f"📢 تم إرسال إشعار طوارئ للمحامي: {lawyer_profile.full_name}")
                
    except Exception as e:
        print(f"⚠️ فشل في إرسال إشعارات الطوارئ: {e}")
    
    return {
        "id": emergency_request.id,
        "message": "تم إرسال طلب الطوارئ بنجاح",
        "status": emergency_request.status,
        "created_at": emergency_request.created_at,
        "has_voice_note": voice_note_filename is not None,
        "preferred_lawyer_id": preferred_lawyer_id,
        "notifications_sent": len(available_lawyers) if 'available_lawyers' in locals() else 0
    }


@router.get("/emergency-requests/my-requests")
async def get_my_emergency_requests(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """جلب طلبات الطوارئ الخاصة بالمستخدم"""
    requests = session.exec(
        select(EmergencyLawyerRequest)
        .where(EmergencyLawyerRequest.user_id == current_user.id)
        .order_by(EmergencyLawyerRequest.created_at.desc())
    ).all()
    
    return [
        {
            "id": req.id,
            "description": req.description,
            "status": req.status,
            "priority": req.priority,
            "created_at": req.created_at,
            "expires_at": req.expires_at,
            "has_voice_note": req.voice_note_filename is not None,
            "preferred_lawyer_id": req.preferred_lawyer_id
        }
        for req in requests
    ]


@router.get("/emergency-requests/nearby-requests")
async def get_nearby_emergency_requests(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """للمحامين: جلب الطلبات الموجهة إليهم أو العامة"""
    
    if current_user.role.value != "lawyer":
        raise HTTPException(status_code=403, detail="متاح للمحامين فقط")
    
    profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="الملف الشخصي غير موجود")
    
    lawyer = session.exec(
        select(LawyerProfile).where(LawyerProfile.profile_id == profile.id)
    ).first()
    
    if not lawyer or not lawyer.emergency_available:
        raise HTTPException(status_code=400, detail="يجب تفعيل خدمة الطوارئ")
    
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    
    # جلب الطلبات الموجهة لهذا المحامي أو الطلبات العامة
    requests = session.exec(
        select(EmergencyLawyerRequest).where(
            EmergencyLawyerRequest.status == "pending",
            EmergencyLawyerRequest.created_at > one_hour_ago,
            EmergencyLawyerRequest.expires_at > datetime.utcnow(),
            or_(
                EmergencyLawyerRequest.preferred_lawyer_id == lawyer.id,
                EmergencyLawyerRequest.preferred_lawyer_id.is_(None)
            )
        ).order_by(EmergencyLawyerRequest.created_at.desc())
    ).all()
    
    return [
        {
            "id": req.id,
            "user_id": req.user_id,
            "description": req.description,
            "user_latitude": req.user_latitude,
            "user_longitude": req.user_longitude,
            "user_location_name": req.user_location_name,
            "preferred_specialization": req.preferred_specialization,
            "priority": req.priority,
            "status": req.status,
            "created_at": req.created_at,
            "expires_at": req.expires_at,
            "contact_phone": req.contact_phone,
            "contact_method": req.contact_method,
            "voice_note_url": req.voice_note_url,
            "is_directed_to_me": req.preferred_lawyer_id == lawyer.id
        }
        for req in requests
    ]


@router.post("/emergency-requests/{request_id}/accept")
async def accept_emergency_request(
    request_id: str,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """للمحامين: قبول طلب طوارئ مع منع القبول المتزامن"""
    
    if current_user.role.value != "lawyer":
        raise HTTPException(status_code=403, detail="متاح للمحامين فقط")
    
    request = session.exec(
        select(EmergencyLawyerRequest)
        .where(EmergencyLawyerRequest.id == request_id)
        .with_for_update()
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="تم قبول الطلب من محامٍ آخر")
    
    profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == current_user.id)
    ).first()
    
    lawyer = session.exec(
        select(LawyerProfile).where(LawyerProfile.profile_id == profile.id)
    ).first()
    
    if not lawyer:
        raise HTTPException(status_code=404, detail="ملف المحامي غير موجود")
    
    # التحقق من أن الطلب موجه لهذا المحامي أو عام
    if request.preferred_lawyer_id and request.preferred_lawyer_id != lawyer.id:
        raise HTTPException(status_code=403, detail="هذا الطلب موجه لمحامٍ آخر")
    
    user = session.get(User, request.user_id)
    user_profile = session.exec(
        select(UserProfile).where(UserProfile.user_id == request.user_id)
    ).first()
    
    if not user or not user_profile:
        raise HTTPException(status_code=404, detail="بيانات المستخدم غير موجودة")
    
    request.status = "accepted"
    request.assigned_lawyer_id = lawyer.id
    request.lawyer_response_time = datetime.utcnow()
    
    session.commit()
    
    # ✅ إنشاء إشعار للمستخدم بأن طلبه تم قبوله
    try:
        NotificationService.create_notification(
            db=session,
            recipient_id=request.user_id,  # المستخدم صاحب الطلب
            title="تم قبول طلب الطوارئ ✅",
            message=f"المحامي {profile.full_name} قبل طلبك للطوارئ",
            notification_type="emergency_accepted",
            related_model="emergency_request",
            related_id=request.id
        )
        print(f"📢 تم إرسال إشعار قبول للمستخدم: {request.user_id}")
        
    except Exception as e:
        print(f"⚠️ فشل في إرسال إشعار القبول: {e}")
    
    user_whatsapp = None
    if user.phone:
        clean_phone = user.phone.replace("+", "").replace(" ", "").replace("-", "")
        user_whatsapp = f"https://wa.me/{clean_phone}?text=مرحباً، أنا المحامي {profile.full_name}. قبلت طلب الطوارئ الخاص بك"
    
    return {
        "message": "تم قبول الطلب بنجاح",
        "request_id": request.id,
        "status": request.status,
        "client_info": {
            "name": user_profile.full_name,
            "phone": user.phone,
            "whatsapp_link": user_whatsapp,
            "location": {
                "latitude": request.user_latitude,
                "longitude": request.user_longitude,
                "address": request.user_location_name
            }
        },
        "voice_note_url": request.voice_note_url
    }


@router.patch("/emergency-requests/{request_id}/cancel")
async def cancel_emergency_request(
    request_id: str,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """إلغاء طلب طوارئ"""
    request = session.get(EmergencyLawyerRequest, request_id)
    
    if not request:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    if request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    if request.status not in ["pending", "accepted"]:
        raise HTTPException(status_code=400, detail="لا يمكن إلغاء الطلب")
    
    # ✅ إرسال إشعار إلغاء إذا كان الطلب مقبولاً
    if request.status == "accepted" and request.assigned_lawyer_id:
        try:
            lawyer = session.get(LawyerProfile, request.assigned_lawyer_id)
            if lawyer:
                lawyer_profile = session.get(UserProfile, lawyer.profile_id)
                if lawyer_profile:
                    NotificationService.create_notification(
                        db=session,
                        recipient_id=lawyer_profile.user_id,
                        title="تم إلغاء طلب الطوارئ ❌",
                        message=f"المستخدم ألغى طلب الطوارئ الذي قبلته",
                        notification_type="emergency_cancelled",
                        related_model="emergency_request", 
                        related_id=request.id
                    )
        except Exception as e:
            print(f"⚠️ فشل في إرسال إشعار الإلغاء: {e}")
    
    request.status = "cancelled"
    session.commit()
    
    return {"message": "تم إلغاء الطلب بنجاح"}


@router.get("/emergency-requests/{request_id}/lawyer-contact", response_model=LawyerContactInfo)
async def get_lawyer_contact(
    request_id: str,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """جلب معلومات الاتصال بالمحامي المعين"""
    request = session.get(EmergencyLawyerRequest, request_id)
    
    if not request:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    if request.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="غير مصرح")
    
    if request.status not in ["accepted", "in_progress", "resolved"]:
        raise HTTPException(status_code=400, detail="لم يتم قبول الطلب بعد")
    
    if not request.assigned_lawyer_id:
        raise HTTPException(status_code=400, detail="لم يتم تعيين محامي")
    
    lawyer = session.get(LawyerProfile, request.assigned_lawyer_id)
    if not lawyer:
        raise HTTPException(status_code=404, detail="المحامي غير موجود")
    
    profile = session.get(UserProfile, lawyer.profile_id)
    user = session.exec(select(User).where(User.id == profile.user_id)).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="بيانات المحامي غير مكتملة")
    
    whatsapp_link = None
    if user.phone:
        clean_phone = user.phone.replace("+", "").replace(" ", "").replace("-", "")
        whatsapp_link = f"https://wa.me/{clean_phone}?text=مرحباً، أحتاج استشارة طارئة"
    
    return LawyerContactInfo(
        lawyer_id=lawyer.id,
        lawyer_name=profile.full_name,
        phone=user.phone,
        whatsapp_link=whatsapp_link,
        specialization=lawyer.specialization,
        rating=lawyer.rating
    )