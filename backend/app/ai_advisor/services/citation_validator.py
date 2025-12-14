import logging
from typing import Optional, Dict, Any, List
from ..core.multi_llm_orchestrator import MultiLLMOrchestrator
from ..rag.semantic_retriever import SemanticRetriever
import json
import re

logger = logging.getLogger(__name__)

class CitationValidator:
    """
    خدمة "مدقق الحقائق" القانوني.
    تتحقق مما إذا كان "ادعاء" معين (مثل نص مادة) مدعوماً بالمستندات
    الموجودة في قاعدة المعرفة (Vector DB).
    """

    # برومبت متخصص للتحقق من الصحة وإخراج JSON
    VALIDATION_PROMPT = """
أنت "مدقق حقائق" قانوني آلي فائق الدقة.
مهمتك هي مقارنة "الادعاء" المقدم من المستخدم مع "السياق" المستخرج من قاعدة المعرفة.
يجب أن تحدد ما إذا كان الادعاء صحيحاً ومدعوماً بالسياق أم لا.

**السياق (من قاعدة المعرفة):**
<context>
{context}
</context>

**الادعاء (من المستخدم):**
<claim>
{claim}
</claim>

**التعليمات:**
أجب *فقط* بكائن JSON صالح (valid JSON) بالشكل التالي:

{
  "is_valid": true,
  "explanation": "شرح موجز لسبب صحة الادعاء.",
  "supporting_passage": "اقتباس المقطع الدقيق من 'السياق' الذي يدعم الادعاء."
}

أو (في حالة عدم الصحة):

{
  "is_valid": false,
  "explanation": "شرح موجز لسبب خطأ الادعاء أو عدم وجوده في السياق.",
  "supporting_passage": null
}

لا تضف أي نص خارج كائن الـ JSON.
"""

    def __init__(self, 
                 orchestrator: MultiLLMOrchestrator,
                 retriever: SemanticRetriever):
        """
        تهيئة المدقق.
        
        Args:
            orchestrator: منسق نماذج الـ LLM.
            retriever: مسترجع المستندات (للعثور على السياق ذي الصلة).
        """
        self.orchestrator = orchestrator
        self.retriever = retriever
        logger.info("✅ CitationValidator Service: تم التهيئة بنجاح.")

    async def validate_claim(self, claim: str) -> Dict[str, Any]:
        """
        التحقق من صحة ادعاء قانوني (e.g., "المادة 101 تنص على...")
        
        Args:
            claim: الادعاء النصي المراد التحقق منه.
            
        Returns:
            قاموس (Dict) يحتوي على نتيجة التحقق (JSON).
        """
        
        # --- 1. استرجاع السياق ذي الصلة بالادعاء ---
        # (لا نحتاج Reranker هنا، لأننا نبحث عن أي دليل يدعم الادعاء)
        try:
            relevant_docs = await self.retriever.retrieve_relevant_content(
                claim, 
                max_results=5 # (5 مستندات كافية للتحقق من الصحة)
            )
            
            if not relevant_docs:
                return {
                    "is_valid": False, 
                    "explanation": "لم يتم العثور على أي مستندات ذات صلة بهذا الادعاء في قاعدة المعرفة.",
                    "supporting_passage": None
                }
            
            context_str = self._format_context(relevant_docs)
            
            # --- 2. استدعاء LLM للتحقق ---
            system_prompt = self.VALIDATION_PROMPT.format(context=context_str, claim=claim)
            
            raw_response = await self.orchestrator.generate_response(
                system_prompt=system_prompt,
                human_prompt=claim, # (يمكن تركه فارغاً)
                model_key="smart" # (يتطلب نموذجاً ذكياً جداً لفهم الفروق الدقيقة)
            )

            # --- 3. تحليل الـ JSON ---
            validation_json = self._extract_json_from_response(raw_response)
            return validation_json

        except json.JSONDecodeError as json_err:
            logger.error(f"❌ CitationValidator: فشل في تحليل JSON. الخطأ: {json_err}. الاستجابة الخام: {raw_response[:200]}...")
            return {"error": "فشل في تحليل استجابة النموذج.", "raw_response": raw_response}
        except Exception as e:
            logger.error(f"❌ CitationValidator: فشل في التحقق. خطأ: {e}")
            return {"error": str(e)}

    def _format_context(self, documents: List[Dict[str, Any]]) -> str:
        """تنسيق المستندات المسترجعة في "سياق" نصي واحد."""
        context_parts = []
        for doc in documents:
            context_parts.append(f"""
---
المصدر: (مستند: '{doc['metadata'].get('document_title', 'غير معروف')}')
المحتوى: {doc['content']}
---
""")
        return "\n".join(context_parts)

    def _extract_json_from_response(self, text: str) -> Dict[str, Any]:
        """استخراج كائن JSON نقي من استجابة الـ LLM."""
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            json_string = json_match.group(0)
            return json.loads(json_string)
        else:
            raise json.JSONDecodeError("No JSON object found", text, 0)