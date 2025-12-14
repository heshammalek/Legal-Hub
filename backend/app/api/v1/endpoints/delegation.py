from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database.connection import get_session
from app.core.security import get_current_active_user
from app.models.user_models import User, LawyerProfile, UserProfile
from app.schemas.delegation_schemas import DelegationRequest, DelegationRequestCreate
from app.models.requests.delegation_request import DelegationRequest as DelegationRequestModel
from app.services.notification_service import NotificationService

router = APIRouter()

# دالة مساعدة لجلب المحامي الحالي
async def get_current_lawyer(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session)
) -> LawyerProfile:
    """جلب ملف المحامي الحالي"""
    
    # التحقق من أن المستخدم محامي
    if current_user.role != "lawyer":
        raise HTTPException(status_code=403, detail="يجب أن تكون محامياً للوصول إلى هذه الصلاحية")
    
    # جلب ملف المحامي
    lawyer = (
        db.query(LawyerProfile)
        .join(UserProfile, LawyerProfile.profile_id == UserProfile.id)
        .filter(UserProfile.user_id == current_user.id)
        .first()
    )
    
    if not lawyer:
        raise HTTPException(status_code=404, detail="لم يتم العثور على ملف المحامي")
    
    return lawyer

# دالة مساعدة لإنشاء بيانات الاستجابة
def create_response_data(request: DelegationRequestModel, db: Session) -> DelegationRequest:
    """إنشاء بيانات الاستجابة من نموذج قاعدة البيانات"""
    # جلب بيانات المحامي الطالب
    requester_lawyer = (
        db.query(LawyerProfile)
        .join(UserProfile, LawyerProfile.profile_id == UserProfile.id)
        .filter(LawyerProfile.id == request.requester_lawyer_id)
        .first()
    )
    
    request_data = {
        "id": str(request.id),
        "court_name": request.court_name,
        "circuit": request.circuit,
        "case_number": request.case_number,
        "case_date": request.case_date,
        "roll": request.roll,
        "required_action": request.required_action,
        "financial_offer": request.financial_offer,
        "contact_phone": request.contact_phone,
        "whatsapp_number": request.whatsapp_number,
        "whatsapp_url": request.whatsapp_url,
        "requester_signature": request.requester_signature,
        "registration_number": request.registration_number,
        "power_of_attorney_number": request.power_of_attorney_number,
        "actor_role": request.actor_role,
        "delegation_identity": request.delegation_identity,
        "status": request.status,
        "requester_lawyer_id": str(request.requester_lawyer_id),
        "accepter_lawyer_id": str(request.accepter_lawyer_id) if request.accepter_lawyer_id else None,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
        "accepted_at": request.accepted_at,
        "confirmed_at": request.confirmed_at,
        "cancelled_at": request.cancelled_at,
        "completed_at": request.completed_at,
        "requester_lawyer_name": requester_lawyer.profile.full_name if requester_lawyer and requester_lawyer.profile else "غير معروف",
        "requester_bar_association": requester_lawyer.bar_association if requester_lawyer else "غير معروف",
        "requester_office_address": requester_lawyer.office_address if requester_lawyer else "غير معروف"
    }
    return DelegationRequest(**request_data)

@router.get("/sent-requests", response_model=List[DelegationRequest])
def get_sent_requests(
    db: Session = Depends(get_session),
    lawyer_profile: LawyerProfile = Depends(get_current_lawyer)
):
    """جلب الطلبات المرسلة"""
    print(f"📤 جلب الطلبات المرسلة للمحامي: {lawyer_profile.id}")
    
    # جلب الطلبات التي أنشأها المحامي الحالي
    requests = db.query(DelegationRequestModel).filter(
        DelegationRequestModel.requester_lawyer_id == lawyer_profile.id
    ).order_by(DelegationRequestModel.created_at.desc()).all()
    
    # تحويل النماذج إلى response models
    result = []
    for req in requests:
        result.append(create_response_data(req, db))
    
    return result

@router.get("/received-requests", response_model=List[DelegationRequest])
def get_received_requests(
    db: Session = Depends(get_session),
    lawyer_profile: LawyerProfile = Depends(get_current_lawyer)
):
    """جلب الطلبات الواردة (المتاحة للقبول)"""
    print(f"📥 جلب الطلبات الواردة للمحامي: {lawyer_profile.id}")
    
    # جلب الطلبات التي لم ينشئها المحامي الحالي وهي pending
    requests = db.query(DelegationRequestModel).filter(
        DelegationRequestModel.requester_lawyer_id != lawyer_profile.id,
        DelegationRequestModel.status == "pending"
    ).order_by(DelegationRequestModel.created_at.desc()).all()
    
    # تحويل النماذج إلى response models
    result = []
    for req in requests:
        result.append(create_response_data(req, db))
    
    return result

@router.post("/", response_model=DelegationRequest)
async def create_delegation_request(
    request: DelegationRequestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session),
    lawyer_profile: LawyerProfile = Depends(get_current_lawyer)
):
    """إنشاء طلب إنابة جديد"""
    print(f"📝 إنشاء طلب إنابة جديد بواسطة المحامي: {lawyer_profile.id}")
    
    try:
        # إنشاء الطلب الجديد
        db_request = DelegationRequestModel(
            **request.model_dump(),
            requester_lawyer_id=lawyer_profile.id,
            status="pending"
        )
        
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        
        print(f"✅ تم إنشاء طلب الإنابة: {db_request.id}")
        
        # إرسال إشعار
        background_tasks.add_task(
            NotificationService.notify_new_delegation,
            db, db_request
        )
        
        return create_response_data(db_request, db)
        
    except Exception as e:
        db.rollback()
        print(f"❌ خطأ في إنشاء طلب الإنابة: {e}")
        raise HTTPException(status_code=500, detail=f"فشل في إنشاء طلب الإنابة: {str(e)}")

@router.post("/{request_id}/accept", response_model=DelegationRequest)
def accept_request(
    request_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session),
    lawyer_profile: LawyerProfile = Depends(get_current_lawyer)
):
    """قبول طلب إنابة"""
    print(f"✋ قبول الطلب {request_id} بواسطة المحامي: {lawyer_profile.id}")
    
    # البحث عن الطلب
    request = db.query(DelegationRequestModel).filter(DelegationRequestModel.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="طلب الإنابة غير موجود")
    
    # التحقق من أن الطلب متاح للقبول
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="الطلب غير متاح للقبول")
    
    if request.requester_lawyer_id == lawyer_profile.id:
        raise HTTPException(status_code=400, detail="لا يمكن قبول طلبك الخاص")
    
    # تحديث حالة الطلب
    request.status = "accepted"
    request.accepter_lawyer_id = lawyer_profile.id
    request.accepted_at = datetime.utcnow()
    request.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    
    print(f"✅ تم قبول الطلب {request_id} بنجاح")
    
    # إرسال إشعار
    background_tasks.add_task(
        NotificationService.notify_delegation_accepted,
        db, request
    )
    
    # إرجاع البيانات المحدثة
    return create_response_data(request, db)

@router.post("/{request_id}/reject", response_model=dict)
def reject_request(
    request_id: str,
    db: Session = Depends(get_session),
    lawyer_profile: LawyerProfile = Depends(get_current_lawyer)
):
    """رفض طلب إنابة - يخفي الطلب من داشبورد المحامي فقط"""
    print(f"👎 رفض الطلب {request_id} بواسطة المحامي: {lawyer_profile.id}")
    
    request = db.query(DelegationRequestModel).filter(DelegationRequestModel.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="طلب الإنابة غير موجود")
    
    # التحقق من أن الطلب ليس للمحامي نفسه
    if request.requester_lawyer_id == lawyer_profile.id:
        raise HTTPException(status_code=400, detail="لا يمكن رفض طلبك الخاص")
    
    # التحقق من أن الطلب متاح للقبول
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="الطلب غير متاح للرفض")
    
    # هنا يمكن إضافة الطلب إلى جدول الطلبات المرفوضة لهذا المحامي
    # للتبسيط، سنعيد نجاح العملية وسيتم التعامل مع الإخفاء في الواجهة
    
    print(f"✅ تم رفض الطلب {request_id} وإخفاؤه من داشبورد المحامي")
    
    return {"message": "تم رفض الطلب وإخفاؤه من قائمتك"}

@router.post("/{request_id}/cancel", response_model=dict)
def cancel_request(
    request_id: str,
    db: Session = Depends(get_session),
    lawyer_profile: LawyerProfile = Depends(get_current_lawyer)
):
    """إلغاء طلب إنابة - للطالب فقط ويمحو الطلب من الجميع"""
    print(f"❌ إلغاء الطلب {request_id} بواسطة المحامي: {lawyer_profile.id}")
    
    request = db.query(DelegationRequestModel).filter(DelegationRequestModel.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="طلب الإنابة غير موجود")
    
    # التحقق من أن المستخدم هو الطالب فقط
    if request.requester_lawyer_id != lawyer_profile.id:
        raise HTTPException(status_code=403, detail="فقط منشئ الطلب يمكنه الإلغاء")
    
    # التحقق من أن الطلب في حالة pending
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="لا يمكن إلغاء الطلب في حالته الحالية")
    
    # حذف الطلب نهائياً من قاعدة البيانات
    db.delete(request)
    db.commit()
    
    print(f"✅ تم حذف الطلب {request_id} نهائياً من النظام")
    
    return {"message": "تم حذف طلب الإنابة بنجاح"}

@router.post("/{request_id}/recreate", response_model=DelegationRequest)
def recreate_request(
    request_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session),
    lawyer_profile: LawyerProfile = Depends(get_current_lawyer)
):
    """إعادة إنشاء طلب إنابة - ينشئ طلب جديد ويحذف القديم"""
    print(f"🔄 إعادة إنشاء الطلب {request_id} بواسطة المحامي: {lawyer_profile.id}")
    
    # البحث عن الطلب الأصلي
    original_request = db.query(DelegationRequestModel).filter(
        DelegationRequestModel.id == request_id,
        DelegationRequestModel.requester_lawyer_id == lawyer_profile.id,
        DelegationRequestModel.status == "accepted"  # فقط الطلبات المقبولة يمكن إعادة نشرها
    ).first()
    
    if not original_request:
        raise HTTPException(status_code=404, detail="طلب الإنابة غير موجود أو غير مقبول")
    
    try:
        # إنشاء طلب جديد بنفس البيانات
        new_request = DelegationRequestModel(
            court_name=original_request.court_name,
            circuit=original_request.circuit,
            case_number=original_request.case_number,
            case_date=original_request.case_date,
            roll=original_request.roll,
            required_action=original_request.required_action,
            financial_offer=original_request.financial_offer,
            contact_phone=original_request.contact_phone,
            whatsapp_number=original_request.whatsapp_number,
            whatsapp_url=original_request.whatsapp_url,
            requester_signature=original_request.requester_signature,
            registration_number=original_request.registration_number,
            power_of_attorney_number=original_request.power_of_attorney_number,
            actor_role=original_request.actor_role,
            delegation_identity=original_request.delegation_identity,
            requester_lawyer_id=lawyer_profile.id,
            status="pending"
        )
        
        # إضافة الطلب الجديد
        db.add(new_request)
        
        # حذف الطلب القديم
        db.delete(original_request)
        
        db.commit()
        db.refresh(new_request)
        
        print(f"✅ تم إعادة إنشاء الطلب: {new_request.id} وحذف الطلب القديم: {request_id}")
        
        # إرسال إشعار جديد
        background_tasks.add_task(
            NotificationService.notify_new_delegation,
            db, new_request
        )
        
        return create_response_data(new_request, db)
        
    except Exception as e:
        db.rollback()
        print(f"❌ خطأ في إعادة إنشاء الطلب: {e}")
        raise HTTPException(status_code=500, detail=f"فشل في إعادة إنشاء الطلب: {str(e)}")

@router.delete("/{request_id}")
def delete_delegation_request(
    request_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_session),
    lawyer_profile: LawyerProfile = Depends(get_current_lawyer)
):
    """حذف طلب إنابة نهائياً (بعد الاتفاق)"""
    print(f"🗑️ حذف الطلب {request_id} نهائياً بواسطة المحامي: {lawyer_profile.id}")
    
    request = db.query(DelegationRequestModel).filter(DelegationRequestModel.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="طلب الإنابة غير موجود")
    
    if request.requester_lawyer_id != lawyer_profile.id:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لحذف هذا الطلب")
    
    # التحقق من أن الطلب مقبول
    if request.status != "accepted":
        raise HTTPException(status_code=400, detail="لا يمكن حذف الطلب في حالته الحالية")
    
    # حذف الطلب نهائياً من قاعدة البيانات
    db.delete(request)
    db.commit()
    
    print(f"✅ تم حذف الطلب {request_id} نهائياً")
    
    # إرسال إشعار للحذف
    background_tasks.add_task(
        NotificationService.notify_delegation_deleted,
        db, request_id
    )
    
    return {"message": "تم حذف طلب الإنابة بنجاح"}


