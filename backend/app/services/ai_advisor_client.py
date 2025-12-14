import logging
import httpx
import os
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class AIAdvisorClient:
    """
    عميل داخلي للتواصل مع خدمة AI Advisor
    """
    
    def __init__(self):
        self.base_url = os.getenv("AI_ADVISOR_BASE_URL", "http://127.0.0.1:8001/ai-advisor/v1")
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=120.0)
        logger.info(f"AIAdvisorClient initialized for URL: {self.base_url}")

    async def query_advisor(self, query: str, filters: Optional[Dict] = None) -> Dict[str, Any]:
        """
        استعلام المستشار الذكي
        """
        try:
            payload = {"query": query}
            if filters:
                payload["filters"] = filters
                
            response = await self.client.post("/query", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"AI Client 'query_advisor' failed: {e}")
            return {"error": str(e), "success": False}

    async def analyze_document(self, text: str, doc_type: Optional[str] = None) -> Dict[str, Any]:
        """
        تحليل مستند
        """
        try:
            payload = {"text": text}
            if doc_type:
                payload["doc_type"] = doc_type
                
            response = await self.client.post("/analyze", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"AI Client 'analyze_document' failed: {e}")
            return {"error": str(e), "success": False}

    async def translate_text(self, text: str, target_lang: str = "الإنجليزية") -> Dict[str, Any]:
        """
        ترجمة نص
        """
        try:
            payload = {
                "text": text, 
                "source_lang": "العربية", 
                "target_lang": target_lang
            }
            
            response = await self.client.post("/translate", json=payload)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"AI Client 'translate_text' failed: {e}")
            return {"error": str(e), "translated_text": text}

    async def close(self):
        """إغلاق العميل"""
        await self.client.aclose()

# Singleton pattern
_ai_client_instance: Optional[AIAdvisorClient] = None

def get_ai_advisor_client() -> AIAdvisorClient:
    global _ai_client_instance
    if _ai_client_instance is None:
        _ai_client_instance = AIAdvisorClient()
    return _ai_client_instance

async def close_ai_advisor_client():
    global _ai_client_instance
    if _ai_client_instance:
        await _ai_client_instance.close()
        _ai_client_instance = None