from fastapi import APIRouter
from . import endpoints, streaming, websockets

# هذا هو الراوتر الرئيسي لإصدار v1
api_router_v1 = APIRouter()

# تضمين الراوترات الفرعية
api_router_v1.include_router(endpoints.router, tags=["AI Advisor - REST"])
api_router_v1.include_router(streaming.router, tags=["AI Advisor - Streaming (SSE)"])
api_router_v1.include_router(websockets.router, tags=["AI Advisor - WebSockets"])