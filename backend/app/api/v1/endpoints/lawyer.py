from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, Optional
from sqlmodel import Session
from app.core.security import get_current_active_user
from app.database.connection import get_session
from app.database.crud import UserCRUD
from app.models.user_models import AvailabilityStatus, User

router = APIRouter()


@router.get("/availability")
async def get_lawyer_availability(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    جلب حالة الاتاحة الحالية للمحامي
    """
    print(f"🎯 GET AVAILABILITY REQUEST FROM USER: {current_user.id}")
    
    if current_user.role != "lawyer":
        raise HTTPException(status_code=403, detail="Only lawyers can access this endpoint")
    
    try:
        availability_data = UserCRUD.get_lawyer_availability(session, current_user.id)
        
        if not availability_data:
            raise HTTPException(status_code=404, detail="Lawyer not found")
        
        print(f"✅ RETURNING AVAILABILITY DATA: {availability_data}")
        return availability_data
        
    except Exception as e:
        print(f"❌ ERROR GETTING AVAILABILITY: {str(e)}")
        import traceback
        print(f"🔍 TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error getting availability: {str(e)}")
    

@router.put("/availability")
async def update_availability(
    availability_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
) -> Dict[str, Any]:
    """
    تحديث حالة الاتاحة للمحامي
    """
    print(f"🎯 UPDATE AVAILABILITY REQUEST FROM USER: {current_user.id}")
    print(f"📊 REQUEST DATA: {availability_data}")
    
    if current_user.role != "lawyer":
        raise HTTPException(status_code=403, detail="Only lawyers can access this endpoint")
    
    try:
        # نستخدم availability_status للاستشارات فقط
        consultations_available = availability_data.get("consultations_available", False)
        availability_status = AvailabilityStatus.AVAILABLE if consultations_available else AvailabilityStatus.OFFLINE
        
        # تحديث البيانات في الداتابيز
        updated_lawyer = UserCRUD.update_lawyer_availability(
            session=session,
            user_id=current_user.id,
            emergency_available=availability_data.get("emergency_available", False),  # للخريطة
            availability_status=availability_status,  # للاستشارات فقط
            lat=availability_data.get("lat"),
            lng=availability_data.get("lng")
        )
        
        print(f"🔄 UPDATED LAWYER - Emergency: {updated_lawyer.emergency_available}, Availability: {updated_lawyer.availability_status}")
        
        if not updated_lawyer:
            raise HTTPException(status_code=404, detail="Failed to update availability")
        
        return {
            "message": "Availability updated successfully",
            "emergency_available": updated_lawyer.emergency_available,  # للخريطة
            "consultations_available": updated_lawyer.availability_status == AvailabilityStatus.AVAILABLE,  # للاستشارات
            "lat": updated_lawyer.latitude,
            "lng": updated_lawyer.longitude
        }
        
    except Exception as e:
        print(f"❌ ERROR UPDATING AVAILABILITY: {str(e)}")
        import traceback
        print(f"🔍 TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error updating availability: {str(e)}")
    

     