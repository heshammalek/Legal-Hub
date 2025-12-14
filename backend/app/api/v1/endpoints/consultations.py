from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlmodel import Session, select
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from app.database.connection import get_session
from app.core.security import get_current_active_user
from app.models.user_models import User, LawyerProfile, UserProfile, AvailabilityStatus
from app.models.requests.consultation_request import ConsultationRequest, ConsultationStatus, ConsultationSession
from app.utils.email import send_consultation_accepted_email, send_consultation_rejected_email
from app.database.crud import UserCRUD

router = APIRouter()


# إنشاء طلب استشارة
@router.post("/consultations/request")
async def create_consultation_request(
    request_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    try:
        consultation = ConsultationRequest(
            user_id=current_user.id,
            lawyer_id=request_data["lawyer_id"],
            subject=request_data["subject"],
            message=request_data["message"],
            country=request_data["country"],
            category=request_data.get("category", ""),
            urgency_level=request_data.get("urgency_level", "normal"),
            consultation_fee=request_data.get("consultation_fee", 100),
            duration_minutes=request_data.get("duration_minutes", 30)
        )
        
        session.add(consultation)
        session.commit()
        session.refresh(consultation)
        
        return {
            "message": "تم إرسال طلب الاستشارة بنجاح",
            "consultation_id": consultation.id,
            "status": consultation.status.value,
            "lawyer_name": "محامي"
        }
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# قبول طلب الاستشارة
@router.post("/consultations/{consultation_id}/accept")
async def accept_consultation(
    consultation_id: str,
    request_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    try:
        print(f"🔍 Accept request for: {consultation_id}")
        print(f"📅 Scheduled time: {request_data.get('scheduled_time')}")
        
        consultation = session.get(ConsultationRequest, consultation_id)
        if not consultation:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
        
        lawyer_profile = UserCRUD.get_lawyer_profile_by_user_id(session, current_user.id)
        if not lawyer_profile or consultation.lawyer_id != lawyer_profile.id:
            raise HTTPException(status_code=403, detail="غير مصرح")
        
        scheduled_time_str = request_data.get("scheduled_time")
        if not scheduled_time_str:
            raise HTTPException(status_code=400, detail="يجب تحديد الموعد")
        
        scheduled_time = datetime.fromisoformat(scheduled_time_str.replace('Z', '+00:00'))
        if scheduled_time <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="الموعد يجب أن يكون في المستقبل")
        
        # تحديث الطلب
        consultation.status = ConsultationStatus.ACCEPTED
        consultation.responded_at = datetime.utcnow()
        consultation.scheduled_time = scheduled_time
        
        # إنشاء الجلسة
        meeting_id = str(uuid.uuid4())[:8]
        zoom_link = f"https://zoom.us/j/{meeting_id}"
        meeting_password = str(uuid.uuid4())[:6].upper()
        
        consultation_session = ConsultationSession(
            consultation_id=consultation_id,
            room_id=meeting_id,
            session_url=zoom_link,
            meeting_password=meeting_password,
            scheduled_time=scheduled_time
        )
        
        session.add(consultation)
        session.add(consultation_session)
        session.commit()
        session.refresh(consultation)
        
        print(f"✅ Consultation accepted, session created")
        
        # جلب بيانات المستخدم
        user_query = select(User, UserProfile).join(
            UserProfile, User.id == UserProfile.user_id
        ).where(User.id == consultation.user_id)
        
        result = session.exec(user_query).first()
        if result:
            user, user_profile = result
            print(f"📧 Sending email to: {user.email}")
            background_tasks.add_task(
                send_consultation_accepted_email,
                user.email, user_profile.full_name, consultation.subject,
                scheduled_time.strftime('%Y-%m-%d %H:%M'), zoom_link, meeting_password
            )
        
        return {
            "message": "تم قبول الطلب بنجاح",
            "consultation_id": consultation.id,
            "status": consultation.status.value,
            "scheduled_time": scheduled_time.isoformat(),
            "meeting_info": {
                "zoom_link": zoom_link,
                "meeting_id": meeting_id,
                "password": meeting_password
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# رفض طلب الاستشارة
@router.post("/consultations/{consultation_id}/reject")
async def reject_consultation(
    consultation_id: str,
    rejection_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    try:
        print(f"🔍 Reject request for: {consultation_id}")
        
        consultation = session.get(ConsultationRequest, consultation_id)
        if not consultation:
            raise HTTPException(status_code=404, detail="الطلب غير موجود")
        
        lawyer_profile = UserCRUD.get_lawyer_profile_by_user_id(session, current_user.id)
        if not lawyer_profile or consultation.lawyer_id != lawyer_profile.id:
            raise HTTPException(status_code=403, detail="غير مصرح")
        
        reason = rejection_data.get("reason", "")
        if not reason.strip():
            raise HTTPException(status_code=400, detail="يجب كتابة سبب الرفض")
        
        # تحديث الطلب
        consultation.status = ConsultationStatus.REJECTED
        consultation.responded_at = datetime.utcnow()
        consultation.rejection_reason = reason
        
        session.add(consultation)
        session.commit()
        session.refresh(consultation)
        
        print(f"✅ Consultation rejected")
        
        # جلب البيانات للإشعار
        user_query = select(User, UserProfile).join(
            UserProfile, User.id == UserProfile.user_id
        ).where(User.id == consultation.user_id)
        
        user_result = session.exec(user_query).first()
        
        lawyer_query = select(UserProfile).where(
            UserProfile.id == lawyer_profile.profile_id
        )
        lawyer_user_profile = session.exec(lawyer_query).first()
        
        if user_result and lawyer_user_profile:
            user, user_profile = user_result
            print(f"📧 Sending rejection email to: {user.email}")
            background_tasks.add_task(
                send_consultation_rejected_email,
                user.email, user_profile.full_name, lawyer_user_profile.full_name,
                consultation.subject, reason
            )
        
        return {
            "message": "تم رفض الطلب",
            "consultation_id": consultation.id,
            "status": consultation.status.value,
            "reason": reason
        }
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# جلب المحامين المتاحين
@router.get("/consultations/available-lawyers")
async def get_available_lawyers(
    country: str = Query(...),
    category: Optional[str] = Query(None),
    session: Session = Depends(get_session)
) -> List[Dict[str, Any]]:
    try:
        query = select(LawyerProfile, UserProfile).join(
            UserProfile, LawyerProfile.profile_id == UserProfile.id
        ).where(
            LawyerProfile.availability_status == AvailabilityStatus.AVAILABLE,
            LawyerProfile.country == country
        )
        
        if category:
            query = query.where(LawyerProfile.specialization.contains(category))
        
        results = session.exec(query).all()
        
        lawyers_list = []
        for lawyer, profile in results:
            try:
                consultations_count = session.query(ConsultationRequest).filter(
                    ConsultationRequest.lawyer_id == lawyer.id,
                    ConsultationRequest.status.in_([ConsultationStatus.COMPLETED, ConsultationStatus.IN_PROGRESS])
                ).count()
            except:
                consultations_count = 0
            
            lawyers_list.append({
                "id": lawyer.id,
                "name": profile.full_name,
                "specialization": lawyer.specialization,
                "rating": getattr(lawyer, 'rating', 0.0),
                "consultation_fee": getattr(lawyer, 'consultation_fee', 100),
                "experience_years": datetime.now().year - getattr(lawyer, 'registration_year', datetime.now().year),
                "consultations_count": consultations_count,
                "languages": ["العربية"],
                "response_time": "٢-٤ ساعات",
                "description": f"محامي متخصص في {lawyer.specialization}",
                "country": lawyer.country,
                "phone": getattr(profile, 'phone', 'غير متوفر')
            })
        
        return lawyers_list
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# جلب طلبات المحامي
@router.get("/consultations/lawyer-requests")
async def get_lawyer_consultation_requests(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
) -> List[Dict[str, Any]]:
    """جلب طلبات الاستشارات للمحامي مع بيانات الجلسة"""
    try:
        lawyer_profile = UserCRUD.get_lawyer_profile_by_user_id(session, current_user.id)
        if not lawyer_profile:
            raise HTTPException(status_code=403, detail="ليس محامياً")
        
        # ✅ JOIN مع ConsultationSession
        query = select(
            ConsultationRequest, 
            User, 
            UserProfile,
            ConsultationSession  # 👈 إضافة الجلسة
        ).join(
            User, ConsultationRequest.user_id == User.id
        ).join(
            UserProfile, User.id == UserProfile.user_id
        ).join(
            ConsultationSession,
            ConsultationRequest.id == ConsultationSession.consultation_id,
            isouter=True  # 👈 LEFT JOIN (قد لا توجد جلسة للطلبات pending)
        ).where(
            ConsultationRequest.lawyer_id == lawyer_profile.id
        ).order_by(
            ConsultationRequest.created_at.desc()
        )
        
        results = session.exec(query).all()
        
        requests_list = []
        for consultation, user, user_profile, session_obj in results:
            request_data = {
                "id": consultation.id,
                "subject": consultation.subject,
                "message": consultation.message,
                "status": consultation.status.value,
                "created_at": consultation.created_at.isoformat(),
                "user_name": user_profile.full_name,
                "consultation_fee": consultation.consultation_fee,
                "country": consultation.country,
                "category": consultation.category,
                "urgency_level": consultation.urgency_level,
                "scheduled_time": consultation.scheduled_time.isoformat() if consultation.scheduled_time else None,
                # ✅ إضافة بيانات الجلسة
                "zoom_link": session_obj.session_url if session_obj else None,
                "meeting_password": session_obj.meeting_password if session_obj else None,
            }
            requests_list.append(request_data)
        
        return requests_list
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# جلب استشارات المستخدم
@router.get("/consultations/my-consultations")
async def get_my_consultations(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
) -> List[Dict[str, Any]]:
    query = select(ConsultationRequest, ConsultationSession, LawyerProfile, UserProfile).join(
        ConsultationSession, ConsultationRequest.id == ConsultationSession.consultation_id, isouter=True
    ).join(
        LawyerProfile, ConsultationRequest.lawyer_id == LawyerProfile.id
    ).join(
        UserProfile, LawyerProfile.profile_id == UserProfile.id
    ).where(
        ConsultationRequest.user_id == current_user.id
    ).order_by(
        ConsultationRequest.created_at.desc()
    )
    
    results = session.exec(query).all()
    
    return [{
        "id": c.id,
        "subject": c.subject,
        "status": c.status.value,
        "lawyer_name": lp.full_name,
        "scheduled_time": c.scheduled_time.isoformat() if c.scheduled_time else None,
        "zoom_link": s.session_url if s else None,
        "meeting_password": s.meeting_password if s else None,
        "rejection_reason": c.rejection_reason
    } for c, s, l, lp in results]