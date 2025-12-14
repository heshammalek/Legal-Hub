# backend/app/api/v1/endpoints/agenda.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import List
from datetime import datetime
import logging

from app.database.connection import get_session
from app.core.security import get_current_active_user
from app.models.user_models import User
from app.models.agenda_models import Event
from app.schemas.agenda_schemas import EventCreate, EventUpdate, EventRead
from app.database import agenda_crud

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def get_current_lawyer_id(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session)
) -> str:
    """استخراج معرف المحامي من المستخدم الحالي"""
    try:
        # ✅ التحقق من وجود البروفايل
        if not current_user.profile:
            logger.error(f"❌ No profile found for user: {current_user.id}")
            raise HTTPException(
                status_code=404, 
                detail="User profile not found. Please complete your profile."
            )
        
        # ✅ التحقق من أن المستخدم محامي باستخدام string comparison بدلاً من Enum
        if current_user.role != "lawyer":
            logger.error(f"❌ User {current_user.id} is not a lawyer, role: {current_user.role}")
            raise HTTPException(
                status_code=403, 
                detail="Only lawyers can access the agenda"
            )
        
        # ✅ التحقق من وجود lawyer_profile
        if not current_user.profile.lawyer_profile:
            logger.error(f"❌ No lawyer profile found for user: {current_user.id}")
            raise HTTPException(
                status_code=403, 
                detail="Lawyer profile not found. Please complete your lawyer profile setup."
            )
        
        lawyer_id = current_user.profile.lawyer_profile.id
        logger.info(f"✅ Retrieved lawyer_id: {lawyer_id} for user: {current_user.id}")
        return lawyer_id
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error getting lawyer_id: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error accessing lawyer profile: {str(e)}"
        )


@router.post("/", response_model=EventRead, status_code=201)
def create_event_endpoint(
    event_in: EventCreate,
    lawyer_id: str = Depends(get_current_lawyer_id),
    db: Session = Depends(get_session)
):
    """إنشاء حدث جديد في الأجندة"""
    try:
        logger.info(f"📅 Creating new event for lawyer: {lawyer_id}")
        event = agenda_crud.create_event(db=db, event_in=event_in, lawyer_id=lawyer_id)
        logger.info(f"✅ Event created successfully: {event.id}")
        return event
    except Exception as e:
        logger.error(f"❌ Failed to create event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to create event: {str(e)}")


@router.get("/", response_model=List[EventRead])
def get_events_endpoint(
    start: datetime = Query(..., description="Start date/time for fetching events"),
    end: datetime = Query(..., description="End date/time for fetching events"),
    lawyer_id: str = Depends(get_current_lawyer_id),
    db: Session = Depends(get_session)
):
    """جلب الأحداث في نطاق زمني محدد"""
    try:
        logger.info(f"📅 Fetching events for lawyer: {lawyer_id}")
        logger.info(f"📅 Date range: {start} to {end}")
        
        events = agenda_crud.get_events_by_lawyer(
            db=db,
            lawyer_id=lawyer_id,
            start=start,
            end=end
        )
        
        logger.info(f"✅ Found {len(events)} events")
        return events
        
    except Exception as e:
        logger.error(f"❌ Error fetching events: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch events: {str(e)}"
        )


@router.get("/{event_id}", response_model=EventRead)
def get_event_by_id_endpoint(
    event_id: str,
    lawyer_id: str = Depends(get_current_lawyer_id),
    db: Session = Depends(get_session)
):
    """جلب حدث محدد بواسطة معرفه"""
    event = agenda_crud.get_event_by_id(db=db, event_id=event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # التحقق من أن الحدث يخص المحامي الحالي
    if event.lawyer_id != lawyer_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this event")
    
    return event


@router.put("/{event_id}", response_model=EventRead)
@router.post("/{event_id}", response_model=EventRead)
def update_event_endpoint(
    event_id: str,
    event_in: EventUpdate,
    lawyer_id: str = Depends(get_current_lawyer_id),
    db: Session = Depends(get_session)
):
    """تحديث حدث موجود"""
    event = agenda_crud.get_event_by_id(db=db, event_id=event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # التحقق من أن الحدث يخص المحامي الحالي
    if event.lawyer_id != lawyer_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this event")
    
    try:
        updated_event = agenda_crud.update_event(db=db, event=event, event_in=event_in)
        logger.info(f"✅ Event updated successfully: {event_id}")
        return updated_event
    except Exception as e:
        logger.error(f"❌ Failed to update event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to update event: {str(e)}")


@router.delete("/{event_id}", status_code=204)
def delete_event_endpoint(
    event_id: str,
    lawyer_id: str = Depends(get_current_lawyer_id),
    db: Session = Depends(get_session)
):
    """حذف حدث"""
    event = agenda_crud.get_event_by_id(db=db, event_id=event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # التحقق من أن الحدث يخص المحامي الحالي
    if event.lawyer_id != lawyer_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this event")
    
    try:
        agenda_crud.delete_event(db=db, event=event)
        logger.info(f"✅ Event deleted successfully: {event_id}")
        return None
    except Exception as e:
        logger.error(f"❌ Failed to delete event: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Failed to delete event: {str(e)}")


# ✅ Endpoint للتشخيص
@router.get("/debug/current-lawyer")
def debug_current_lawyer(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session)
):
    """Debugging: عرض معلومات المحامي الحالي"""
    try:
        profile_data = {
            "user_id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "has_profile": current_user.profile is not None,
        }
        
        if current_user.profile:
            profile_data.update({
                "profile_id": current_user.profile.id,
                "full_name": current_user.profile.full_name,
                "has_lawyer_profile": current_user.profile.lawyer_profile is not None,
            })
            
            if current_user.profile.lawyer_profile:
                profile_data.update({
                    "lawyer_profile_id": current_user.profile.lawyer_profile.id,
                    "lawyer_registration_number": current_user.profile.lawyer_profile.registration_number,
                })
        
        return profile_data
    except Exception as e:
        logger.error(f"❌ Debug error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))