import logging
from typing import List, Dict, Any, Optional
from sentence_transformers import CrossEncoder
import numpy as np
import asyncio

# استيراد مدير الكاش
from ..core.cache_manager import CacheManager 

logger = logging.getLogger(__name__)

class CrossEncoderRanker:
    """
    يستخدم نموذج Cross-Encoder (المصنف المتقدم) لإعادة ترتيب 
    النتائج الأولية المسترجعة من الـ semantic_retriever.
    هذه هي "المرحلة الثانية" من الاسترجاع (Reranking) لضمان أعلى دقة.
    """
    
    def __init__(
        self, 
        model_name: str = 'BAAI/bge-reranker-base', 
        top_k: int = 5,
        batch_size: int = 16,
        cache_manager: Optional[CacheManager] = None
    ):
        """
        تهيئة المصنف.
        
        Args:
            model_name: اسم نموذج الـ Cross-Encoder من HuggingFace.
                        (BAAI/bge-reranker-base هو خيار ممتاز وخفيف)
            top_k: عدد النتائج النهائية التي سيتم إرجاعها بعد إعادة الترتيب.
            batch_size: حجم الدفعة للمعالجة (لزيادة كفاءة الـ GPU/CPU).
            cache_manager: مدير الكاش لتخزين النتائج المكلفة حسابياً.
        """
        try:
            self.model = CrossEncoder(model_name)
            self.top_k = top_k
            self.batch_size = batch_size
            self.cache_manager = cache_manager
            logger.info(f"✅ تم تحميل CrossEncoderRanker بنجاح باستخدام نموذج: {model_name}")
        except Exception as e:
            logger.error(f"❌ فشل تحميل نموذج CrossEncoder: {model_name}. خطأ: {e}")
            raise

    async def rerank_documents(self, query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        إعادة ترتيب قائمة المستندات المرشحة (candidates) بناءً على الاستعلام (query).
        """
        if not candidates:
            logger.debug("لا توجد مستندات مرشحة لإعادة الترتيب.")
            return []
            
        # --- 1. التحقق من الكاش ---
        # مفتاح الكاش يعتمد على الاستعلام ومحتوى المستندات المرشحة
        if self.cache_manager:
            try:
                candidate_ids = hash(tuple(doc['metadata'].get('chunk_id', doc['content']) for doc in candidates))
                cache_key = f"rerank:{query}:{candidate_ids}"
                cached_results = await self.cache_manager.get(cache_key)
                if cached_results:
                    logger.debug(f"🔍 تم العثور على نتائج إعادة الترتيب في الكاش لـ: {query[:50]}...")
                    return cached_results
            except Exception as e:
                logger.warning(f"⚠️ فشل التحقق من كاش إعادة الترتيب: {e}")

        # --- 2. إعداد أزواج (الاستعلام، المستند) للنموذج ---
        # (query, document_content)
        pairs = [(query, doc['content']) for doc in candidates]
        
        # --- 3. تشغيل النموذج (عملية مكلفة) ---
        # نستخدم asyncio.to_thread لتشغيل النموذج (وهو متزامن Sync) 
        # في "ثريد" منفصل لمنع تجميد (Blocking) الـ Event Loop.
        try:
            logger.debug(f"🚀 بدء إعادة ترتيب {len(pairs)} مستند لـ: {query[:50]}...")
            
            def _predict():
                # تشغيل النموذج مع batching لإدارة الذاكرة والأداء
                return self.model.predict(
                    pairs, 
                    batch_size=self.batch_size, 
                    show_progress_bar=False  # (يمكن تفعيلها للـ debugging)
                )

            # تشغيل الدالة المتزامنة في ثريد منفصل
            scores = await asyncio.to_thread(_predict)
            
            # التأكد من أن المخرجات هي numpy array
            if not isinstance(scores, np.ndarray):
                scores = np.array(scores)

            logger.debug(f"📊 تم حساب درجات إعادة الترتيب بنجاح.")

        except Exception as e:
            logger.error(f"❌ خطأ أثناء تشغيل CrossEncoder.predict: {e}")
            # في حالة الفشل، نرجع النتائج الأصلية بترتيبها
            return candidates[:self.top_k]

        # --- 4. دمج النتائج وفرزها ---
        ranked_results = []
        for i, doc in enumerate(candidates):
            new_score = float(scores[i])
            
            # إضافة/تحديث البيانات الوصفية
            doc['rerank_score'] = new_score
            # (اختياري: الاحتفاظ بالدرجة الأصلية للمقارنة)
            if 'similarity' in doc:
                doc['metadata']['original_similarity'] = doc.get('similarity')
            
            # استبدال درجة التشابه القديمة بالدرجة الجديدة الأكثر دقة
            doc['similarity'] = new_score 
            ranked_results.append(doc)

        # الفرز بناءً على الدرجة الجديدة (الأعلى أفضل)
        sorted_results = sorted(ranked_results, key=lambda x: x['rerank_score'], reverse=True)
        
        # اختيار أفضل K نتائج فقط
        final_results = sorted_results[:self.top_k]

        # --- 5. تخزين النتيجة في الكاش ---
        if self.cache_manager:
            try:
                # (cache_key تم حسابه في الخطوة 1)
                await self.cache_manager.set(cache_key, final_results, ttl=3600) # تخزين لمدة ساعة
            except Exception as e:
                logger.warning(f"⚠️ فشل تخزين نتائج إعادة الترتيب في الكاش: {e}")

        return final_results

