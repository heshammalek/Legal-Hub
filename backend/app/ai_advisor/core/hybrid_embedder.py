import logging
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List
import asyncio
from functools import lru_cache

logger = logging.getLogger(__name__)

class HybridEmbedder:
    """
    مسؤول عن إنشاء التضمينات (Embeddings) للنصوص.
    نستخدم نموذج BAAI/bge-base-ar-v1.5 كونه الأفضل للنصوص العربية القانونية.
    
    (ملاحظة: اسم "Hybrid" مستقبلي، قد يدمج لاحقاً نماذج SPLADE أو BM25،
    ولكن حالياً يركز على التضمينات الدلالية الكثيفة (Dense Embeddings)).
    """
    
    # هذا النموذج هو الأفضل للعربية حالياً وينتج 768 بعداً
    #DEFAULT_MODEL = "BAAI/bge-base-ar-v1.5"            #اسم النموذج اتغير او الموديل اتسحب  النموذج ده متوافق مع ابعاد الفيكتور 768
    #HF_AUTH_LOGIN = "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"
    #DEFAULT_MODEL = "intfloat/multilingual-e5-large"   # النموذج ده متوافق مع ابعاد الفيكتور 1024 لذلك يلزم لاستعماله تعديل القيمة في ملفين الحالي وفيكتور مانجر 
   
    DEFAULT_MODEL = "intfloat/multilingual-e5-base"

    
    def __init__(self, model_name: str = DEFAULT_MODEL):
        try:
            # استخدام @lru_cache يضمن تحميل النموذج مرة واحدة فقط
            self.model = self._get_model(model_name)
            self.dimension = self.model.get_sentence_embedding_dimension()
            
            if self.dimension != 768:
                logger.warning(f"أبعاد النموذج ({self.dimension}) لا تتطابق مع أبعاد قاعدة البيانات (768). قد تحدث أخطاء.")
                
            logger.info(f"✅ HybridEmbedder: تم تحميل نموذج {model_name} (أبعاد: {self.dimension})")
            
        except Exception as e:
            logger.error(f"❌ HybridEmbedder: فشل تحميل نموذج {model_name}. خطأ: {e}")
            raise

    @staticmethod
    @lru_cache(maxsize=None)
    def _get_model(model_name: str) -> SentenceTransformer:
        """
        دالة ستاتيكية مع كاش لتحميل النموذج مرة واحدة فقط على مستوى التطبيق.
        """
        logger.info(f"تحميل نموذج SentenceTransformer: {model_name}...")
        return SentenceTransformer(model_name)

    def _encode_sync(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        الدالة المتزامنة (Sync) الفعلية التي تقوم بالتضمين.
        """
        # إضافة تعليمات الاستعلام للنموذج (BGE-specific)
        # (ملاحظة: BGE لا يتطلب تعليمات خاصة للاستعلامات العربية بنفس الطريقة الإنجليزية)
        return self.model.encode(
            texts, 
            batch_size=batch_size, 
            normalize_embeddings=True,  # مهم جداً لبحث Cosine Similarity
            show_progress_bar=False
        )

    async def get_embedding(self, text: str) -> np.ndarray:
        """
        إنشاء تضمين لنص واحد (بشكل غير متزامن).
        """
        # (استدعاء get_embeddings بدلاً من get_embedding لتوحيد المنطق)
        embeddings = await self.get_embeddings([text])
        return embeddings[0]

    async def get_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        إنشاء تضمينات لمجموعة نصوص (بشكل غير متزامن).
        
        نستخدم asyncio.to_thread لتشغيل دالة .encode() المتزامنة 
        (التي تستهلك CPU/GPU) في "ثريد" منفصل لمنع تجميد (Blocking) الـ Event Loop.
        """
        if not texts:
            return np.array([])
            
        try:
            # تشغيل المهمة الحسابية في ثريد منفصل
            embeddings = await asyncio.to_thread(self._encode_sync, texts)
            return embeddings
        
        except Exception as e:
            logger.error(f"❌ فشل في إنشاء التضمينات: {e}")
            # إرجاع مصفوفة فارغة بالشكل الصحيح
            return np.empty((0, self.dimension))

    def get_model_info(self) -> dict:
        """إرجاع معلومات عن النموذج المستخدم."""
        return {
            "model_name": self.model.model.name_or_path,
            "dimension": self.dimension
        }