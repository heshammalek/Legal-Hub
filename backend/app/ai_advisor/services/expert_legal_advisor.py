import logging
from typing import Optional, Dict, Any, List, AsyncGenerator
from ..core.multi_llm_orchestrator import MultiLLMOrchestrator
from ..core.cache_manager import CacheManager
from ..rag.semantic_retriever import SemanticRetriever
from ..rag.cross_encoder_ranker import CrossEncoderRanker
import hashlib
import json

logger = logging.getLogger(__name__)

class ExpertLegalAdvisor:
    """
    الخدمة الأساسية للمستشار القانوني الخبير (RAG Pipeline).
    1. يسترجع (Retrieve) المستندات ذات الصلة.
    2. يعيد ترتيبها (Rerank) لاختيار الأفضل.
    3. يولد (Generate) إجابة مدعومة بالمصادر.
    """
    
    # برومبت المستشار الخبير
    EXPERT_PROMPT = """
أنت مستشار قانوني خبير ومحترف، متخصص في التشريعات والقوانين المصرية.
مهمتك هي الإجابة على سؤال المستخدم بدقة واحترافية، بالاعتماد *حصرياً* على السياق القانوني (المواد والأحكام) المقدم لك.

**السياق القانوني (المصادر):**
<context>
{context}
</context>

**سؤال المستخدم:**
{query}

**تعليمات صارمة:**
1.  **الاعتماد على المصادر:** يجب أن تكون إجابتك مستندة بالكامل إلى "السياق القانوني" المقدم.
2.  **ذكر المصادر:** عند تقديم معلومة، يجب أن تذكر المصدر (e.g., "وفقاً للمادة 101 من قانون..." أو "كما ذكر في المستند '... '").
3.  **الدقة:** كن دقيقاً ومحدداً. لا تقدم آراء شخصية أو معلومات خارج السياق.
4.  **في حالة عدم المعرفة:** إذا كان "السياق القانوني" لا يحتوي على معلومات كافية للإجابة على السؤال، أجب بوضوح: "بناءً على المستندات المتوفرة، لا توجد معلومات كافية للإجابة على هذا السؤال."
5.  **التنسيق:** قدم إجابة واضحة ومنظمة.

**الإجابة القانونية:**
"""

    def __init__(self, 
                 orchestrator: MultiLLMOrchestrator,
                 retriever: SemanticRetriever,
                 reranker: CrossEncoderRanker,
                 cache_manager: Optional[CacheManager] = None):
        """
        تهيئة المستشار الخبير.
        
        Args:
            orchestrator: منسق نماذج الـ LLM.
            retriever: مسترجع المستندات (المرحلة 1).
            reranker: مصنف إعادة الترتيب (المرحلة 2).
            cache_manager: مدير الكاش لتخزين الإجابات النهائية.
        """
        self.orchestrator = orchestrator
        self.retriever = retriever
        self.reranker = reranker
        self.cache_manager = cache_manager
        logger.info("✅ ExpertLegalAdvisor Service: تم التهيئة بنجاح.")

    async def _retrieve_and_rank(self, query: str, filters: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        تنفيذ خطوتي الاسترجاع وإعادة الترتيب.
        """
        # --- المرحلة 1: الاسترجاع الدلالي (سريع) ---
        # نجلب عدد كبير نسبياً من المرشحين (e.g., 25)
        initial_candidates = await self.retriever.retrieve_relevant_content(
            query, 
            max_results=25, 
            filters=filters
        )
        if not initial_candidates:
            logger.warning(f"RAG: لم يتم العثور على مستندات مرشحة للاستعلام: {query[:50]}...")
            return []

        # --- المرحلة 2: إعادة الترتيب (دقيق) ---
        # الـ Reranker سيختار أفضل K (e.g., 5) من الـ 25
        reranked_docs = await self.reranker.rerank_documents(query, initial_candidates)
        
        logger.debug(f"RAG: تم العثور على {len(reranked_docs)} مستند ذي صلة بعد إعادة الترتيب.")
        return reranked_docs

    def _format_context(self, documents: List[Dict[str, Any]]) -> str:
        """تنسيق المستندات المسترجعة في "سياق" نصي واحد للـ LLM."""
        if not documents:
            return "لا توجد مستندات في قاعدة المعرفة."
            
        context_parts = []
        for i, doc in enumerate(documents):
            context_parts.append(f"""
---
المصدر {i+1}: (من مستند: '{doc['metadata'].get('document_title', 'غير معروف')}')
(رقم المادة: {doc['metadata'].get('article_number', 'N/A')})
(درجة الصلة: {doc['similarity']:.4f})

{doc['content']}
---
""")
        return "\n".join(context_parts)

    async def answer_question_stream(
        self, 
        query: str, 
        filters: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        الإجابة على سؤال (مع بث متدفق - Streaming) مدعوم بالمصادر.
        (لا يستخدم الكاش).
        """
        try:
            # --- 1. الاسترجاع وإعادة الترتيب ---
            reranked_docs = await self._retrieve_and_rank(query, filters)
            
            # --- 2. تنسيق السياق ---
            context_str = self._format_context(reranked_docs)
            
            # --- 3. بناء البرومبت ---
            system_prompt = self.EXPERT_PROMPT.format(context=context_str, query=query)
            
            # --- 4. بث الإجابة (Streaming) ---
            logger.debug(f"Streaming RAG response for: {query[:50]}...")
            
            async for chunk in self.orchestrator.generate_response_stream(
                system_prompt=system_prompt,
                human_prompt=query, # (يمكن ترك هذا فارغاً لأن السؤال مدمج في برومبت النظام)
                model_key="smart"
            ):
                yield {"type": "text", "content": chunk}

            # --- 5. إرسال المصادر بعد انتهاء البث ---
            # (هذا يسمح للـ Frontend بعرض المصادر بعد اكتمال الإجابة)
            sources = [doc['metadata'] for doc in reranked_docs]
            yield {"type": "sources", "content": sources}

        except Exception as e:
            logger.error(f"❌ ExpertAdvisor (Stream): فشل. خطأ: {e}")
            yield {"type": "error", "content": f"حدث خطأ في النظام: {e}"}

    async def answer_question(
        self, 
        query: str, 
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        الإجابة على سؤال (استجابة كاملة) مدعوم بالمصادر.
        (يستخدم الكاش).
        """
        
        # --- 1. التحقق من الكاش ---
        cache_key = ""
        if self.cache_manager:
            query_hash = hashlib.sha256(f"{query}{json.dumps(filters, sort_keys=True)}".encode('utf-8')).hexdigest()
            cache_key = f"rag_answer:{query_hash}"
            cached_answer = await self.cache_manager.get(cache_key)
            if cached_answer:
                logger.debug("ExpertAdvisor: تم العثور على الإجابة في الكاش.")
                return cached_answer

        # --- 2. الاسترجاع وإعادة الترتيب ---
        reranked_docs = await self._retrieve_and_rank(query, filters)
        context_str = self._format_context(reranked_docs)
        
        # --- 3. بناء البرومبت ---
        system_prompt = self.EXPERT_PROMPT.format(context=context_str, query=query)
        
        # --- 4. إنشاء الإجابة الكاملة ---
        try:
            full_response = await self.orchestrator.generate_response(
                system_prompt=system_prompt,
                human_prompt=query,
                model_key="smart",
                use_cache=False # (الكاش يتم هنا على مستوى الخدمة)
            )
            
            sources = [doc['metadata'] for doc in reranked_docs]
            final_result = {"answer": full_response, "sources": sources}

            # --- 5. تخزين النتيجة في الكاش ---
            if self.cache_manager:
                await self.cache_manager.set(cache_key, final_result, ttl=3600) # ساعة واحدة

            return final_result

        except Exception as e:
            logger.error(f"❌ ExpertAdvisor (Full): فشل. خطأ: {e}")
            return {"answer": f"حدث خطأ في النظام: {e}", "sources": []}