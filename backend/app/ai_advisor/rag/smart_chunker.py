from typing import List, Dict, Any
import re
from dataclasses import dataclass, field
import logging

# استيراد من ملف مجاور في نفس الحزمة
from .advanced_pdf_processor import LegalArticle

logger = logging.getLogger(__name__)

@dataclass
class TextChunk:
    """يمثل "جزء" نصي جاهز للتضمين (Embedding) والتخزين."""
    text: str
    metadata: Dict[str, Any]
    token_count: int
    chunk_type: str  # (e.g., "full_article", "partial_article")

class SmartChunker:
    """
    مقسم نصوص ذكي للوثائق القانونية،
    يعتمد على تقسيم المواد (Articles) كـ "أجزاء" (Chunks) منطقية.
    """
    
    def __init__(self, max_chunk_size: int = 512, overlap: int = 50):
        """
        تهيئة المقسم.
        max_chunk_size: الحد الأقصى للكلمات (أو التوكنز) في الجزء الواحد.
        overlap: عدد الكلمات المتداخلة عند تقسيم الأجزاء الكبيرة.
        """
        # (نفترض أن 'tokens' في LegalArticle هي عدد الكلمات)
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap
        
        # التأكد من أن التداخل منطقي
        if self.overlap >= self.max_chunk_size:
            self.overlap = int(self.max_chunk_size * 0.1) # 10% overlap كاحتياطي
            
        logger.info(f"SmartChunker initialized (Max Size: {self.max_chunk_size} words, Overlap: {self.overlap} words)")

    def chunk_articles(self, articles: List[LegalArticle]) -> List[TextChunk]:
        """
        الوظيفة الرئيسية: تحويل قائمة من المواد القانونية إلى قائمة من الأجزاء.
        """
        all_chunks = []
        for article in articles:
            # التحقق من أن المادة تحتوي على محتوى فعلي
            if not article.content or article.tokens == 0:
                continue

            if article.tokens <= self.max_chunk_size:
                # 1. المادة قصيرة كفاية: تُعتبر "جزء" واحد.
                all_chunks.append(self._create_chunk_from_article(article))
            else:
                # 2. المادة طويلة جداً: يجب تقسيمها بذكاء.
                all_chunks.extend(self._split_long_article(article))
        
        logger.info(f"تم تحويل {len(articles)} مادة إلى {len(all_chunks)} جزء (Chunk)")
        return all_chunks

    def _create_chunk_from_article(self, article: LegalArticle) -> TextChunk:
        """إنشاء جزء واحد من مادة كاملة."""
        metadata = self._build_metadata(article)
        
        return TextChunk(
            text=article.full_text,  # نستخدم النص الكامل (e.g., "المادة 1: المحتوى...")
            metadata=metadata,
            token_count=article.tokens,
            chunk_type="full_article"
        )

    def _split_long_article(self, article: LegalArticle) -> List[TextChunk]:
        """
        تقسيم المادة الطويلة إلى أجزاء أصغر مع تداخل (Sliding Window).
        """
        chunks = []
        base_metadata = self._build_metadata(article)
        
        # نقسم المحتوى فقط (بدون رقم المادة)
        words = article.content.split()
        if not words:
            return []

        # حجم الخطوة = الحجم الأقصى - التداخل
        step_size = self.max_chunk_size - self.overlap
        if step_size <= 0:
            step_size = self.max_chunk_size # (في حالة التداخل غير الصحيح)

        chunk_index = 0
        for i in range(0, len(words), step_size):
            chunk_words = words[i : i + self.max_chunk_size]
            if not chunk_words:
                continue
                
            chunk_text = " ".join(chunk_words)
            
            # إضافة السياق (رقم المادة) لكل جزء
            if i == 0:
                # الجزء الأول يبدأ بـ "المادة..."
                contextual_text = f"المادة {article.number}: {chunk_text}"
            else:
                # الأجزاء التالية تبدأ بـ "تكملة المادة..."
                contextual_text = f"(تكملة المادة {article.number}): {chunk_text}"
            
            metadata = base_metadata.copy()
            metadata["chunk_part"] = chunk_index + 1
            
            chunks.append(TextChunk(
                text=contextual_text,
                metadata=metadata,
                token_count=len(chunk_words), # (هذا عدد الكلمات، وليس توكنز BPE)
                chunk_type="partial_article"
            ))
            chunk_index += 1
            
        return chunks

    def _build_metadata(self, article: LegalArticle) -> Dict[str, Any]:
        """إنشاء قاموس البيانات الوصفية الموحد للجزء."""
        return {
            "article_number": article.number,
            "page": article.page,
            "section": article.section,
            "source_tokens": article.tokens # (طول المادة الأصلية)
        }
    


    def chunk_text(self, text: str) -> List[str]:
        """
        تقسيم النص العادي إلى أجزاء - طريقة توافقية
        تستخدم عندما لا تكون هناك مواد قانونية محددة
        """
        try:
            # إذا كان النص قصيراً، إرجاعه كجزء واحد
            words = text.split()
            if len(words) <= self.max_chunk_size:
                return [text]
            
            # تقسيم النص الطويل إلى أجزاء
            chunks = []
            step_size = self.max_chunk_size - self.overlap
            
            for i in range(0, len(words), step_size):
                chunk_words = words[i:i + self.max_chunk_size]
                if chunk_words:
                    chunk_text = " ".join(chunk_words)
                    chunks.append(chunk_text)
            
            logger.info(f"✂️ تم تقسيم النص إلى {len(chunks)} جزء")
            return chunks
            
        except Exception as e:
            logger.error(f"❌ فشل تقسيم النص: {e}")
            return [text]  # إرجاع النص كاملاً كحل بديل