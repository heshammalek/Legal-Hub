from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from typing import List, Optional

from app.models.requests.delegation_request import DelegationRequest, DelegationStatus
from app.schemas.delegation_schemas import DelegationRequestCreate

def create_delegation_request(db: Session, request_data: DelegationRequestCreate, lawyer_id: str):
    """إنشاء طلب إنابة جديد"""
    db_request = DelegationRequest(
        **request_data.dict(),
        requester_lawyer_id=lawyer_id,
        status=DelegationStatus.PENDING
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def get_sent_requests(db: Session, lawyer_id: str) -> List[DelegationRequest]:
    """جلب الطلبات المرسلة"""
    return db.query(DelegationRequest).filter(
        DelegationRequest.requester_lawyer_id == lawyer_id
    ).order_by(DelegationRequest.created_at.desc()).all()

def get_available_requests(db: Session, lawyer_id: str) -> List[DelegationRequest]:
    """جلب الطلبات المتاحة للقبول (لا تخص المحامي الحالي)"""
    return db.query(DelegationRequest).filter(
        DelegationRequest.requester_lawyer_id != lawyer_id,
        DelegationRequest.status == DelegationStatus.PENDING
    ).order_by(DelegationRequest.created_at.desc()).all()

def accept_delegation_request(db: Session, request_id: str, lawyer_id: str):
    """قبول طلب إنابة"""
    request = db.query(DelegationRequest).filter(DelegationRequest.id == request_id).first()
    
    if not request:
        raise HTTPException(404, "طلب الإنابة غير موجود")
    
    if request.requester_lawyer_id == lawyer_id:
        raise HTTPException(400, "لا يمكن قبول طلبك الخاص")
    
    if request.status != DelegationStatus.PENDING:
        raise HTTPException(400, "الطلب غير متاح للقبول")
    
    request.status = DelegationStatus.ACCEPTED
    request.accepter_lawyer_id = lawyer_id
    request.accepted_at = datetime.utcnow()
    request.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    return request

def reject_delegation_request(db: Session, request_id: str, lawyer_id: str):
    """رفض طلب إنابة (يخفيها من واجهة المحامي فقط)"""
    # في هذا التبسيط، الرفض يعني عدم عرض الطلب للمحامي مرة أخرى
    # يمكن تنفيذ هذا بجدول منفصل لتتبع الطلبات المرفوضة
    request = db.query(DelegationRequest).filter(DelegationRequest.id == request_id).first()
    
    if not request:
        raise HTTPException(404, "طلب الإنابة غير موجود")
    
    # هنا يمكن إضافة الطلب إلى قائمة المرفوضة لهذا المحامي
    # للتبسيط، سنعيد الطلب كما هو وسيتم التعامل معه في الواجهة الأمامية
    
    return request

def cancel_delegation_request(db: Session, request_id: str, lawyer_id: str):
    """إلغاء طلب إنابة"""
    request = db.query(DelegationRequest).filter(DelegationRequest.id == request_id).first()
    
    if not request:
        raise HTTPException(404, "طلب الإنابة غير موجود")
    
    if request.requester_lawyer_id != lawyer_id:
        raise HTTPException(403, "ليس لديك صلاحية لإلغاء هذا الطلب")
    
    request.status = DelegationStatus.CANCELLED
    request.cancelled_at = datetime.utcnow()
    request.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    return request

def recreate_delegation_request(db: Session, request_id: str, lawyer_id: str):
    """إعادة إنشاء طلب إنابة - ينشئ طلب جديد ويحذف القديم"""
    original_request = db.query(DelegationRequest).filter(
        DelegationRequest.id == request_id,
        DelegationRequest.requester_lawyer_id == lawyer_id,
        DelegationRequest.status == DelegationStatus.ACCEPTED
    ).first()
    
    if not original_request:
        raise HTTPException(404, "طلب الإنابة غير موجود")
    
    try:
        # إنشاء طلب جديد بنفس البيانات
        new_request_data = {
            "court_name": original_request.court_name,
            "circuit": original_request.circuit,
            "case_number": original_request.case_number,
            "case_date": original_request.case_date,
            "roll": original_request.roll,
            "required_action": original_request.required_action,
            "financial_offer": original_request.financial_offer,
            "contact_phone": original_request.contact_phone,
            "whatsapp_number": original_request.whatsapp_number,
            "whatsapp_url": original_request.whatsapp_url,
            "requester_signature": original_request.requester_signature,
            "registration_number": original_request.registration_number,
            "power_of_attorney_number": original_request.power_of_attorney_number,
            "actor_role": original_request.actor_role,
            "delegation_identity": original_request.delegation_identity,
        }
        
        # إنشاء الطلب الجديد
        new_request = create_delegation_request(db, DelegationRequestCreate(**new_request_data), lawyer_id)
        
        # حذف الطلب القديم
        db.delete(original_request)
        db.commit()
        
        return new_request
        
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"فشل في إعادة إنشاء الطلب: {str(e)}")