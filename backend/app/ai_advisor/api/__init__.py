from fastapi import APIRouter
from .v1 import api_router_v1

# هذا هو الراوتر الرئيسي لخدمة ai_advisor بأكملها
main_api_router = APIRouter()

# تحميل راوتر v1 تحت المسار /v1
main_api_router.include_router(api_router_v1, prefix="/v1")