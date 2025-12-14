# backend/app/data_acquisition/intelligent_classifier.py
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

class IntelligentClassifier:
    def __init__(self, llm_service=None):
        self.llm_service = llm_service
        
    async def classify_document(self, file_path: str, content: str = "") -> Tuple[str, str]:
        """تصنيف ذكي للمستند باستخدام AI"""
        try:
            if self.llm_service and content:
                # استخدام LLM للتصنيف الذكي
                classification_prompt = f"""
                قم بتصنيف المستند القانوني التالي:
                
                المحتوى: {content[:2000]}...
                
                اختر التصنيف المناسب من:
                - دستور (01_constitutions)
                - قرارات (02_decisions) 
                - تقارير (03_reports)
                - قوانين (04_laws)
                - أحكام (05_judgments)
                - اتفاقيات دولية (06_international_agreements)
                - قوالب قانونية (07_legal_templates)
                
                اعد الإجابة بالتنسيق: country|category
                """
                
                response = await self.llm_service.generate_response(
                    system_prompt="أنت مصنف قانوني خبير",
                    human_prompt=classification_prompt
                )
                
                if "|" in response:
                    country, category = response.split("|")
                    return country.strip(), category.strip()
            
            # التصنيف الافتراضي إذا فشل الذكاء الاصطناعي
            return "egypt", "04_laws"
            
        except Exception as e:
            logger.error(f"❌ خطأ في التصنيف الذكي: {e}")
            return "egypt", "04_laws"  # قيم افتراضية