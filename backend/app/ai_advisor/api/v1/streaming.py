import logging
import asyncio
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator

# استيراد الاعتماديات ونماذج Pydantic
from ..dependencies import get_expert_legal_advisor
from ...services.expert_legal_advisor import ExpertLegalAdvisor
from .endpoints import QueryRequest # (إعادة استخدام نموذج Pydantic من endpoints)

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/query-stream", summary="سؤال المستشار الخبير (بث متدفق SSE)")
async def query_expert_stream(
    request: QueryRequest,
    advisor: ExpertLegalAdvisor = Depends(get_expert_legal_advisor)
):
    """
    إرسال سؤال إلى نظام RAG والحصول على بث متدفق (Streaming) بالإجابة والمصادر.
    يستخدم بروتوكول Server-Sent Events (SSE).
    """
    
    async def stream_generator() -> AsyncGenerator[str, None]:
        """مولد البث المتدفق لإرسال البيانات للعميل."""
        try:
            logger.debug(f"Streaming (SSE) request received for: {request.query[:50]}...")
            stream = advisor.answer_question_stream(
                query=request.query,
                filters=request.filters
            )
            
            async for chunk in stream:
                # تنسيق الرسالة كـ Server-Sent Event (SSE)
                # data: {"type": "...", "content": "..."}\n\n
                yield f"data: {json.dumps(chunk)}\n\n"
                await asyncio.sleep(0.01) # للسماح للـ Event Loop بالعمل
                
        except Exception as e:
            logger.error(f"Query Stream (SSE) API Error: {e}", exc_info=True)
            error_chunk = {"type": "error", "content": f"Server error: {e}"}
            yield f"data: {json.dumps(error_chunk)}\n\n"
        
        finally:
            # إرسال رسالة انتهاء
            end_chunk = {"type": "end", "content": "Stream completed."}
            yield f"data: {json.dumps(end_chunk)}\n\n"

    return StreamingResponse(stream_generator(), media_type="text/event-stream")