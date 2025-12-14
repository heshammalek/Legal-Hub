import logging
from typing import Optional, Dict
from ..core.multi_llm_orchestrator import MultiLLMOrchestrator
from ..core.cache_manager import CacheManager
import hashlib

logger = logging.getLogger(__name__)

class LegalTranslator:
    """
    خدمة ترجمة متخصصة للمصطلحات والمستندات القانونية.
    تستخدم LLMs لضمان الدقة السياقية للمصطلحات القانونية.
    """
    
    # برومبت متخصص للترجمة القانونية
    LEGAL_TRANSLATION_PROMPT = """
أنت مترجم قانوني محترف وخبير في المصطلحات القانونية بين اللغتين {source_lang} و {target_lang}.
مهمتك هي ترجمة النص التالي بدقة متناهية، مع الحفاظ على المعنى القانوني الدقيق لكل مصطلح.
لا تقم بإضافة أي شروحات أو مقدمات. أخرج النص المترجم فقط.
"""

    def __init__(self, 
                 orchestrator: MultiLLMOrchestrator, 
                 cache_manager: Optional[CacheManager] = None):
        """
        تهيئة المترجم.
        
        Args:
            orchestrator: منسق نماذج الـ LLM.
            cache_manager: مدير الكاش لتخزين الترجمات المكلفة.
        """
        self.orchestrator = orchestrator
        self.cache_manager = cache_manager
        logger.info("✅ LegalTranslator Service: تم التهيئة بنجاح.")

    async def translate_text(self, 
                             text: str, 
                             source_lang: str, 
                             target_lang: str) -> str:
        """
        ترجمة نص قانوني من لغة إلى أخرى.
        
        Args:
            text: النص المراد ترجمته.
            source_lang: اللغة المصدر (e.g., "العربية").
            target_lang: اللغة الهدف (e.g., "الإنجليزية").
            
        Returns:
            النص المترجم.
        """
        if not text.strip():
            return ""

        # --- 1. التحقق من الكاش أولاً ---
        cache_key = ""
        if self.cache_manager:
            # إنشاء مفتاح كاش فريد وآمن
            text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
            cache_key = f"translate:{text_hash}:{source_lang}:{target_lang}"
            cached_translation = await self.cache_manager.get(cache_key)
            if cached_translation:
                logger.debug("LegalTranslator: تم العثور على الترجمة في الكاش.")
                return cached_translation

        # --- 2. بناء البرومبت والاتصال بـ LLM ---
        try:
            system_prompt = self.LEGAL_TRANSLATION_PROMPT.format(
                source_lang=source_lang, 
                target_lang=target_lang
            )
            
            # نستخدم نموذج "ذكي" (smart) لضمان دقة الترجمة القانونية
            translated_text = await self.orchestrator.generate_response(
                system_prompt=system_prompt,
                human_prompt=text,
                model_key="smart", # استخدام أفضل نموذج متاح (e.g., GPT-4o, Claude 3.5 Sonnet)
                use_cache=False # (الكاش يتم هنا على مستوى الخدمة)
            )

            # --- 3. تخزين النتيجة في الكاش ---
            if self.cache_manager:
                # تخزين الترجمة الناجحة لمدة 24 ساعة
                await self.cache_manager.set(cache_key, translated_text, ttl=86400)

            return translated_text

        except Exception as e:
            logger.error(f"❌ LegalTranslator: فشل في ترجمة النص. خطأ: {e}")
            # إرجاع النص الأصلي كاحتياطي في حالة الفشل
            return text