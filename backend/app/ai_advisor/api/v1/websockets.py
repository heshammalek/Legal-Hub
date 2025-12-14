import logging
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from typing import Optional, Dict, Any

# استيراد الاعتماديات (Services)
from ..dependencies import get_expert_legal_advisor
from ...services.expert_legal_advisor import ExpertLegalAdvisor
import json

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/query")
async def websocket_query_expert(
    websocket: WebSocket,
    advisor: ExpertLegalAdvisor = Depends(get_expert_legal_advisor)
):
    """
    نقطة نهاية WebSocket للتفاعل المباشر مع المستشار الخبير (RAG).
    
    بروتوكول الرسائل:
    1. العميل يرسل (JSON): {"query": "سؤالي...", "filters": {...}}
    2. الخادم يرسل (JSON): {"type": "text", "content": "جزء من الإجابة..."}
    3. الخادم يرسل (JSON): {"type": "text", "content": "جزء آخر..."}
    4. الخادم يرسل (JSON): {"type": "sources", "content": [...]} (في النهاية)
    """
    
    await websocket.accept()
    logger.info("WebSocket: تم قبول الاتصال.")
    
    try:
        while True:
            # 1. انتظار رسالة من العميل
            data = await websocket.receive_text()
            try:
                request_data = json.loads(data)
                query = request_data.get("query")
                filters = request_data.get("filters")

                if not query:
                    await websocket.send_json({
                        "type": "error", 
                        "content": "الاستعلام (query) مطلوب."
                    })
                    continue
                
                logger.info(f"WebSocket: تم استلام استعلام: {query[:50]}...")
                
                # 2. بدء البث المتدفق (Streaming)
                stream = advisor.answer_question_stream(query=query, filters=filters)
                
                async for chunk in stream:
                    # 3. إرسال الأجزاء (chunks) للعميل
                    await websocket.send_json(chunk)
                
                # (إرسال رسالة انتهاء اختيارية)
                await websocket.send_json({"type": "end", "content": "اكتمل الاستعلام."})

            except json.JSONDecodeError:
                logger.warning("WebSocket: تم استلام رسالة JSON غير صالحة.")
                await websocket.send_json({
                    "type": "error", 
                    "content": "الرسالة يجب أن تكون JSON صالح."
                })
            except Exception as e:
                logger.error(f"WebSocket: خطأ أثناء معالجة الاستعلام: {e}", exc_info=True)
                await websocket.send_json({
                    "type": "error", 
                    "content": f"خطأ في الخادم: {e}"
                })

    except WebSocketDisconnect:
        logger.info(f"WebSocket: تم قطع الاتصال (Client disconnected).")
    except Exception as e:
        logger.error(f"WebSocket: خطأ فادح في الاتصال: {e}", exc_info=True)
        # (محاولة إغلاق الاتصال إذا كان لا يزال مفتوحاً)
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except:
            pass