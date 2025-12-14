from pydantic import BaseModel
from typing import Optional

class TokenData(BaseModel):
    sub: Optional[str]      # البريد الإلكتروني
    user_id: Optional[str]  # الـ UUID للمستخدم
    user_type: Optional[str]# الدور (قيمة من UserRole)
    exp: Optional[int]      # الوقت المنتهي من الـ JWT (مُضافة أوتوماتيكياً)
    