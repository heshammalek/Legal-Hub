import logging
import json
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx
import os
from typing import Optional

# استيراد نظام التوثيق الحالي
from app.core.security import get_current_active_user
from app.models.user_models import User

logger = logging.getLogger(__name__)
router = APIRouter()

# عنوان خدمة AI Advisor
AI_ADVISOR_BASE_URL = os.getenv("AI_ADVISOR_BASE_URL", "http://127.0.0.1:8001/ai-advisor/v1")

# عميل HTTP غير متزامن
ai_client = httpx.AsyncClient(
    base_url=AI_ADVISOR_BASE_URL,
    timeout=60.0
)

@router.post("/ai/query")
async def proxy_ai_query(
    request: Request,
    current_user: User = Depends(get_current_active_user)  # ✅ التوثيق مفعل
):
    """
    بروكسي لطلبات الاستعلام إلى AI Advisor
    """
    try:
        # قراءة الـ body من الطلب الأصلي
        body_bytes = await request.body()
        
        # إرسال الطلب إلى خدمة AI Advisor
        response = await ai_client.post(
            "/query", 
            content=body_bytes, 
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        
        return response.json()
        
    except httpx.HTTPStatusError as e:
        logger.error(f"AI Proxy HTTP Error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(
            status_code=e.response.status_code, 
            detail=f"AI service error: {e.response.text}"
        )
    except Exception as e:
        logger.error(f"AI Proxy Internal Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error in AI proxy")

@router.post("/ai/translate")
async def proxy_ai_translate(
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    بروكسي لطلبات الترجمة
    """
    try:
        body_bytes = await request.body()
        
        response = await ai_client.post(
            "/translate", 
            content=body_bytes, 
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        
        return response.json()
        
    except httpx.HTTPStatusError as e:
        logger.error(f"AI Translate Proxy Error: {e.response.status_code}")
        raise HTTPException(status_code=e.response.status_code, detail="Translation service error")
    except Exception as e:
        logger.error(f"AI Translate Internal Error: {e}")
        raise HTTPException(status_code=500, detail="Internal translation error")

@router.post("/ai/analyze")
async def proxy_ai_analyze(
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    بروكسي لطلبات التحليل
    """
    try:
        body_bytes = await request.body()
        
        response = await ai_client.post(
            "/analyze", 
            content=body_bytes, 
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        
        return response.json()
        
    except Exception as e:
        logger.error(f"AI Analyze Proxy Error: {e}")
        raise HTTPException(status_code=500, detail="Analysis service error")

@router.post("/ai/query-stream")
async def proxy_ai_stream(
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    """
    بروكسي للبث المتدفق
    """
    body_bytes = await request.body()

    async def stream_generator():
        try:
            async with ai_client.stream(
                "POST", 
                "/query-stream", 
                content=body_bytes, 
                headers={"Content-Type": "application/json"},
                timeout=300
            ) as response:
                response.raise_for_status()
                
                async for chunk in response.aiter_bytes():
                    yield chunk
                    
        except Exception as e:
            logger.error(f"AI Proxy Stream Error: {e}")
            error_data = {"type": "error", "content": str(e)}
            yield f"data: {json.dumps(error_data)}\n\n".encode()

    return StreamingResponse(
        stream_generator(), 
        media_type="text/event-stream"
    )