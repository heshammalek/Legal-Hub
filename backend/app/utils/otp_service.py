# backend/app/utils/otp_service.py
import random
import string
from datetime import datetime, timedelta
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

class OTPService:
    def __init__(self):
        self._pending_requests: Dict[str, dict] = {}
    
    def generate_otp(self, length: int = 6) -> str:
        """توليد رمز OTP عشوائي"""
        return ''.join(random.choices(string.digits, k=length))
    
    def store_otp_request(self, user_id: str, email: str, action: str, data: dict) -> str:
        """تخزين طلب OTP مؤقت"""
        otp_code = self.generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        # استخدام email كجزء من المفتاح لتجنب التعارض
        key = f"{email}_{action}"
        
        self._pending_requests[key] = {
            'otp': otp_code,
            'user_id': user_id,
            'data': data,
            'expires_at': expires_at,
            'attempts': 0,
            'created_at': datetime.utcnow()
        }
        
        logger.info(f"📱 OTP stored for {email}: {otp_code} (expires: {expires_at})")
        return otp_code
    
    def verify_otp(self, email: str, action: str, otp: str) -> Optional[dict]:
        """التحقق من صحة OTP"""
        key = f"{email}_{action}"
        
        if key not in self._pending_requests:
            logger.warning(f"❌ OTP attempt for non-existent request: {key}")
            return None
        
        request_data = self._pending_requests[key]
        
        # التحقق من انتهاء الصلاحية
        if datetime.utcnow() > request_data['expires_at']:
            del self._pending_requests[key]
            logger.warning(f"❌ OTP expired for {email}")
            return None
        
        # التحقق من عدد المحاولات
        if request_data['attempts'] >= 3:
            del self._pending_requests[key]
            logger.warning(f"❌ OTP max attempts reached for {email}")
            return None
        
        request_data['attempts'] += 1
        
        # التحقق من صحة OTP
        if request_data['otp'] == otp:
            data = request_data['data']
            data['user_id'] = request_data['user_id']  # إضافة user_id للبيانات
            del self._pending_requests[key]  # مسح الطلب بعد التحقق الناجح
            logger.info(f"✅ OTP verified successfully for {email}")
            return data
        else:
            logger.warning(f"❌ Invalid OTP for {email}: {otp} (expected: {request_data['otp']})")
        
        return None
    
    def get_pending_request(self, email: str, action: str) -> Optional[dict]:
        """الحصول على طلب OTP معلق (للت debugging)"""
        key = f"{email}_{action}"
        return self._pending_requests.get(key)
    
    def cleanup_expired(self):
        """تنظيف الطلبات المنتهية"""
        now = datetime.utcnow()
        expired_keys = [
            key for key, data in self._pending_requests.items()
            if data['expires_at'] < now
        ]
        for key in expired_keys:
            del self._pending_requests[key]
        if expired_keys:
            logger.info(f"🧹 Cleaned up {len(expired_keys)} expired OTP requests")

# إنشاء instance عالمي
otp_service = OTPService()