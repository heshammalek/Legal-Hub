import logging
from typing import Dict, Any, List
import json
import re

# (هذا الملف سيعتمد على المكونات الأساسية)
from ..core.multi_llm_orchestrator import MultiLLMOrchestrator

logger = logging.getLogger(__name__)

class DataEnricher:
    """
    خدمة لإثراء البيانات الوصفية (Metadata) للمستندات
    باستخدام نماذج اللغة (LLMs).
    """
    
    ENRICHMENT_PROMPT = """
أنت محلل بيانات خبير. لديك عينة من مستند قانوني.
مهمتك هي استخراج 3-5 "تصنيفات" (categories) دقيقة تصف المستند.
أجب *فقط* كقائمة JSON.

مثال:
["عقود", "قانون مدني", "عقارات", "عقد إيجار"]

العينة:
{text_sample}

التصنيفات (قائمة JSON فقط):
"""

    def __init__(self, orchestrator: MultiLLMOrchestrator):
        self.orchestrator = orchestrator
        logger.info("✅ DataEnricher Service: تم التهيئة.")

    async def enrich_metadata(self, 
                              metadata: Dict[str, Any], 
                              text_sample: str) -> Dict[str, Any]:
        """
        إثراء قاموس البيانات الوصفية.
        """
        if not text_sample:
            return metadata

        logger.debug(f"بدء إثراء البيانات الوصفية لـ: {metadata.get('title')}")
        
        try:
            # 1. إضافة تصنيفات (Tags) باستخدام LLM
            # (نستخدم 'fast' لتقليل التكلفة والوقت)
            raw_response = await self.orchestrator.generate_response(
                system_prompt=self.ENRICHMENT_PROMPT.format(text_sample=text_sample[:1500]), # عينة 1500 حرف
                human_prompt="", # البرومبت مدمج بالكامل في النظام
                model_key="fast",
                use_cache=True # (الكاش هنا مفيد إذا تكررت العينات)
            )
            
            # 2. استخراج قائمة JSON
            categories = self._extract_json_list(raw_response)
            if categories:
                metadata['tags'] = categories

        except Exception as e:
            logger.warning(f"⚠️ فشل إثراء البيانات الوصفية: {e}")
        
        return metadata

    def _extract_json_list(self, text: str) -> List[str]:
        """استخراج قائمة JSON من استجابة LLM."""
        try:
            # البحث عن بداية ونهاية القائمة
            list_match = re.search(r'\[.*\]', text, re.DOTALL)
            if list_match:
                json_string = list_match.group(0)
                return json.loads(json_string)
        except json.JSONDecodeError:
            pass # (فشل بصمت)
            
        return []

# --- كيفية الاستخدام ---
# (يمكن تعديل `law_ingestion.py` لاستدعاء هذا)
# 
# enricher = DataEnricher(orchestrator_instance)
# 
# (داخل اللوب الخاص بمعالجة الملفات)
# from app.ai_advisor.rag.advanced_pdf_processor import AdvancedPDFProcessor
# processor = AdvancedPDFProcessor()
# result = processor.process_law_pdf(pdf_path) # (هذا سيفتح الملف مرتين، غير مثالي)
# (الأفضل: تعديل 'ingest_legal_document' ليقبل 'enricher' ويمرر 'result.full_text')
# 
# text_sample = result.full_text[:1500]
# metadata = await enricher.enrich_metadata(metadata, text_sample)
# 
# (ثم تمرير metadata المثراة إلى 'retriever.ingest_legal_document')