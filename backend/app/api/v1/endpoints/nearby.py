# backend/app/api/v1/endpoints/nearby.py

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import List
from math import radians, cos, sin, sqrt, atan2
from pydantic import BaseModel

from app.database.connection import get_session
from app.models.user_models import LawyerProfile, UserProfile, AvailabilityStatus, MembershipStatus

router = APIRouter(
    tags=["Location"]
)

# نموذج البيانات المُرتجعة
class NearbyLawyer(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    specialization: str
    rating: float
    distance: str
    availability_status: str
    emergency_available: bool

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """حساب المسافة بين نقطتين باستخدام معادلة Haversine"""
    R = 6371  # نصف قطر الأرض بالكيلومتر
    
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    
    a = (sin(dlat / 2) ** 2 + 
         cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2)
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c

@router.get("/nearby", response_model=List[NearbyLawyer])
def get_nearby_lawyers(
    lat: float = Query(..., description="User's latitude"),
    lng: float = Query(..., description="User's longitude"),
    radius_km: float = Query(20, description="Search radius in kilometers"),
    emergency_only: bool = Query(False, description="Filter for emergency available lawyers only"),
    session: Session = Depends(get_session)
):
    """
    البحث عن المحامين القريبين بناءً على الموقع
    """
    print(f"🔍 Searching for lawyers near lat={lat}, lng={lng}, radius={radius_km}km, emergency_only={emergency_only}")
    
    # فلترة أولية للمواقع داخل مربع جغرافي (لتحسين الأداء)
    lat_margin = radius_km / 111.0  # تقريباً 111 كم لكل درجة خط عرض
    lng_margin = radius_km / (111.0 * cos(radians(lat)))  # يتغير حسب خط العرض
    
    # ✅ البناء الديناميكي للاستعلام
    base_conditions = [
        LawyerProfile.latitude.is_not(None),
        LawyerProfile.longitude.is_not(None),
        LawyerProfile.latitude.between(lat - lat_margin, lat + lat_margin),
        LawyerProfile.longitude.between(lng - lng_margin, lng + lng_margin),
        LawyerProfile.membership_status == MembershipStatus.ACTIVE  # ✅ فقط المحامين المفعلين
    ]
    
    # ✅ إضافة شرط الطواريء إذا emergency_only = True
    if emergency_only:
        base_conditions.append(LawyerProfile.emergency_available == True)
        print("🎯 Filtering for EMERGENCY available lawyers only")
    else:
        # ✅ إذا لم يكن emergency_only، نبحث عن المحامين المتاحين بشكل عام (availability_status)
        base_conditions.append(LawyerProfile.availability_status != AvailabilityStatus.OFFLINE)
        print("🔍 Including all available lawyers (not offline)")
    
    # استعلام قاعدة البيانات
    query = select(LawyerProfile, UserProfile).join(
        UserProfile, LawyerProfile.profile_id == UserProfile.id
    ).where(*base_conditions)
    
    results = session.exec(query).all()
    print(f"📍 Found {len(results)} lawyers in database within bounds")
    
    # حساب المسافة الفعلية وفلترة النتائج
    nearby_lawyers = []
    for lawyer_profile, user_profile in results:
        if lawyer_profile.latitude is not None and lawyer_profile.longitude is not None:
            distance = calculate_distance(
                lat, lng,
                lawyer_profile.latitude, lawyer_profile.longitude
            )
            
            if distance <= radius_km:
                nearby_lawyers.append(NearbyLawyer(
                    id=lawyer_profile.id,
                    name=user_profile.full_name,
                    lat=lawyer_profile.latitude,
                    lng=lawyer_profile.longitude,
                    specialization=lawyer_profile.specialization,
                    rating=lawyer_profile.rating,
                    distance=f"{distance:.2f} كم",
                    availability_status=lawyer_profile.availability_status.value,
                    emergency_available=lawyer_profile.emergency_available
                ))
    
    # ترتيب من الأقرب إلى الأبعد
    nearby_lawyers.sort(key=lambda l: float(l.distance.split(" ")[0]))
    
    print(f"✅ Returning {len(nearby_lawyers)} lawyers within {radius_km}km radius")
    return nearby_lawyers

# ✅ إضافة endpoint خاص لخريطة الطواريء فقط
@router.get("/emergency-lawyers", response_model=List[NearbyLawyer])
def get_emergency_lawyers_only(
    lat: float = Query(..., description="User's latitude"),
    lng: float = Query(..., description="User's longitude"),
    radius_km: float = Query(20, description="Search radius in kilometers"),
    session: Session = Depends(get_session)
):
    """
    جلب المحامين المتاحين للطواريء فقط (emergency_available = True)
    """
    print(f"🚨 EMERGENCY ONLY: Searching near lat={lat}, lng={lng}, radius={radius_km}km")
    
    # فلترة أولية للمواقع داخل مربع جغرافي
    lat_margin = radius_km / 111.0
    lng_margin = radius_km / (111.0 * cos(radians(lat)))
    
    # ✅ استعلام خاص للطواريء فقط
    query = select(LawyerProfile, UserProfile).join(
        UserProfile, LawyerProfile.profile_id == UserProfile.id
    ).where(
        LawyerProfile.emergency_available == True,  # ✅ الشرط الأساسي للطواريء
        LawyerProfile.latitude.is_not(None),
        LawyerProfile.longitude.is_not(None),
        LawyerProfile.latitude.between(lat - lat_margin, lat + lat_margin),
        LawyerProfile.longitude.between(lng - lng_margin, lng + lng_margin),
        LawyerProfile.membership_status == MembershipStatus.ACTIVE
    )
    
    results = session.exec(query).all()
    print(f"🚨 Found {len(results)} EMERGENCY lawyers in database within bounds")
    
    # حساب المسافة الفعلية وفلترة النتائج
    emergency_lawyers = []
    for lawyer_profile, user_profile in results:
        if lawyer_profile.latitude is not None and lawyer_profile.longitude is not None:
            distance = calculate_distance(
                lat, lng,
                lawyer_profile.latitude, lawyer_profile.longitude
            )
            
            if distance <= radius_km:
                emergency_lawyers.append(NearbyLawyer(
                    id=lawyer_profile.id,
                    name=user_profile.full_name,
                    lat=lawyer_profile.latitude,
                    lng=lawyer_profile.longitude,
                    specialization=lawyer_profile.specialization,
                    rating=lawyer_profile.rating,
                    distance=f"{distance:.2f} كم",
                    availability_status=lawyer_profile.availability_status.value,
                    emergency_available=lawyer_profile.emergency_available
                ))
    
    # ترتيب من الأقرب إلى الأبعد
    emergency_lawyers.sort(key=lambda l: float(l.distance.split(" ")[0]))
    
    print(f"🚨 Returning {len(emergency_lawyers)} EMERGENCY lawyers within {radius_km}km radius")
    return emergency_lawyers