import logging
import re
from typing import Optional, Dict, Any, List
from ..core.multi_llm_orchestrator import MultiLLMOrchestrator
from ..core.cache_manager import CacheManager
import hashlib
import json

logger = logging.getLogger(__name__)

class DocumentAnalyzer:
    """
    خدمة لتحليل المستندات القانونية (تلخيص، استخراج كيانات، كلمات مفتاحية).
    تستخدم LLM لإنتاج مخرجات JSON منظمة.
    """
    
    # برومبت متخصص للتحليل القانوني وإخراج JSON
    ANALYSIS_PROMPT_TEMPLATE = """
أنت محلل قانوني آلي فائق الذكاء. مهمتك هي قراءة المستند القانوني التالي وتحليله.
يجب عليك إخراج الرد *حصرياً* بصيغة JSON صالحة (valid JSON) بالشكل التالي:

{
  "summary": "ملخص تنفيذي دقيق للمستند القانوني لا يتجاوز 5 جمل.",
  "keywords": ["قائمة", "بالكلمات", "المفتاحية", "القانونية", "الرئيسية"],
  "key_entities": {
    "persons": ["أسماء الأشخاص المذكورين"],
    "organizations": ["أسماء الشركات أو المؤسسات"],
    "locations": ["المواقع الجغرافية المذكورة"],
    "legal_articles": ["أرقام المواد القانونية أو القوانين المشار إليها (e.g., 'المادة 101')"]
  },
  "document_type_suggestion": "نوع المستند المقترح (e.g., 'حكم قضائي', 'عقد إيجار', 'لائحة داخلية')"
}

لا تقم بإضافة أي نص قبل أو بعد كائن الـ JSON.
"""

    def __init__(self, 
                 orchestrator: MultiLLMOrchestrator, 
                 cache_manager: Optional[CacheManager] = None):
        """
        تهيئة المحلل.
        
        Args:
            orchestrator: منسق نماذج الـ LLM.
            cache_manager: مدير الكاش لتخزين التحليلات المكلفة.
        """
        self.orchestrator = orchestrator
        self.cache_manager = cache_manager
        logger.info("✅ DocumentAnalyzer Service: تم التهيئة بنجاح.")

    async def analyze_document(self, document_text: str) -> Dict[str, Any]:
        """
        تحليل مستند قانوني كامل وإرجاع بيانات منظمة.
        
        Args:
            document_text: النص الكامل للمستند.
            
        Returns:
            قاموس (Dict) يحتوي على التحليل المنظم.
        """
        if not document_text.strip():
            return {"error": "النص فارغ."}

        # --- 1. التحقق من الكاش ---
        cache_key = ""
        if self.cache_manager:
            text_hash = hashlib.sha256(document_text.encode('utf-8')).hexdigest()
            cache_key = f"analyze:{text_hash}"
            cached_analysis = await self.cache_manager.get(cache_key)
            if cached_analysis:
                logger.debug("DocumentAnalyzer: تم العثور على التحليل في الكاش.")
                return cached_analysis

        # --- 2. استدعاء LLM لإنشاء الـ JSON ---
        try:
            # نستخدم نموذج "ذكي" لضمان الالتزام بتعليمات JSON المعقدة
            raw_response = await self.orchestrator.generate_response(
                system_prompt=self.ANALYSIS_PROMPT_TEMPLATE,
                human_prompt=f"<document_text>\n{document_text}\n</document_text>",
                model_key="smart", # (GPT-4o أو Claude 3.5 Sonnet ممتازين لهذا)
                use_cache=False 
            )

            # --- 3. تنظيف ومعالجة الـ JSON ---
            analysis_json = self._extract_json_from_response(raw_response)
            
            # --- 4. تخزين النتيجة في الكاش ---
            if self.cache_manager:
                await self.cache_manager.set(cache_key, analysis_json, ttl=86400) # 24 ساعة

            return analysis_json

        except json.JSONDecodeError as json_err:
            logger.error(f"❌ DocumentAnalyzer: فشل في تحليل JSON. الخطأ: {json_err}. الاستجابة الخام: {raw_response[:200]}...")
            return {"error": "فشل في تحليل استجابة النموذج.", "raw_response": raw_response}
        except Exception as e:
            logger.error(f"❌ DocumentAnalyzer: فشل في تحليل المستند. خطأ: {e}")
            return {"error": str(e)}

    def _extract_json_from_response(self, text: str) -> Dict[str, Any]:
        """
        تنظيف استجابة الـ LLM لاستخراج كائن JSON نقي.
        (بعض النماذج تضيف '```json' ... '```' حول الكائن).
        """
        # البحث عن بداية ونهاية كائن JSON
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            json_string = json_match.group(0)
            return json.loads(json_string)
        else:
            logger.warning("DocumentAnalyzer: لم يتم العثور على كائن JSON في استجابة LLM.")
            raise json.JSONDecodeError("No JSON object found", text, 0)