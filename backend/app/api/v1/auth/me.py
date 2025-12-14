from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.security import get_current_active_user
from app.database.connection import get_session as get_db
from app.models.user_models import LawyerProfile, User, UserProfile
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/me")
def get_current_user_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    جلب معلومات المستخدم الحالي
    """
    try:
        logger.info(f"🔍 /me request from user: {current_user.id} ({current_user.email})")
        
        response = {
            "id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "is_active": current_user.is_active,
            "redirect_url": f"/dashboards/{current_user.role}",
            "lawyer_id": None
        }

        # ✅ إذا كان المستخدم محامياً، جلب lawyer_id
        if current_user.role == "lawyer":
            logger.info(f"   👨‍⚖️ المستخدم محامي - جلب LawyerProfile...")
            
            try:
                lawyer_profile = (
                    db.query(LawyerProfile)
                    .join(UserProfile, LawyerProfile.profile_id == UserProfile.id)
                    .filter(UserProfile.user_id == current_user.id)
                    .first()
                )
                
                if lawyer_profile:
                    response["lawyer_id"] = lawyer_profile.id
                    logger.info(f"   ✅ تم العثور على lawyer_id: {lawyer_profile.id}")
                else:
                    logger.warning(f"   ⚠️ لم يتم العثور على LawyerProfile للمستخدم {current_user.id}")
                    
                    # التحقق من وجود UserProfile
                    user_profile = db.query(UserProfile).filter(
                        UserProfile.user_id == current_user.id
                    ).first()
                    
                    if not user_profile:
                        logger.error(f"   ❌ لا يوجد UserProfile للمستخدم {current_user.id}")
                    else:
                        logger.info(f"   ℹ️ UserProfile موجود: {user_profile.id}")
                        logger.error(f"   ❌ لكن لا يوجد LawyerProfile مرتبط به")
                    
            except Exception as e:
                logger.error(f"   ❌ خطأ في جلب LawyerProfile: {e}")
                import traceback
                traceback.print_exc()

        logger.info(f"   ✅ استجابة /me: {response}")
        return response
        
    except Exception as e:
        logger.error(f"❌ خطأ في /me endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"خطأ في جلب بيانات المستخدم: {str(e)}"
        )