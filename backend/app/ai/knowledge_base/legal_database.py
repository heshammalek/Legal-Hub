import logging
from typing import List, Dict, Any, Optional
import json

logger = logging.getLogger(__name__)

class LegalKnowledgeBase:
    def __init__(self):
        self.country_laws: Dict[str, List[Dict]] = {}
        self._initialize_sample_data()
    
    def _initialize_sample_data(self):
        """تهيئة بيانات قانونية عينة"""
        self.country_laws = {
            'SA': [
                {
                    "id": "law_sa_1",
                    "title": "النظام الأساسي للحكم",
                    "articles": [
                        {
                            "article_number": "١",
                            "text": "المملكة العربية السعودية دولة عربية إسلامية ذات سيادة تامة...",
                            "category": "دستوري"
                        }
                    ]
                }
            ],
            'AE': [
                {
                    "id": "law_ae_1", 
                    "title": "الدستور الإماراتي",
                    "articles": [
                        {
                            "article_number": "١",
                            "text": "الإمارات العربية المتحدة دولة اتحادية مستقلة ذات سيادة...",
                            "category": "دستوري"
                        }
                    ]
                }
            ]
        }
    
    async def find_relevant_laws(self, query: str, country_code: str) -> List[Dict]:
        """البحث عن القوانين ذات الصلة"""
        
        try:
            relevant_laws = []
            
            if country_code in self.country_laws:
                for law in self.country_laws[country_code]:
                    # بحث بسيط في النص - سيتم تطويره
                    if any(keyword in query for keyword in law.get('keywords', [])):
                        relevant_laws.append(law)
            
            logger.info(f"تم العثور على {len(relevant_laws)} قانون ذو صلة")
            return relevant_laws
            
        except Exception as e:
            logger.error(f"خطأ في البحث عن القوانين: {str(e)}")
            return []
    
    async def get_law_details(self, country_code: str, law_id: str) -> Optional[Dict]:
        """الحصول على تفاصيل قانون معين"""
        if country_code in self.country_laws:
            for law in self.country_laws[country_code]:
                if law["id"] == law_id:
                    return law
        return None
    
    def add_law(self, country_code: str, law_data: Dict):
        """إضافة قانون جديد"""
        if country_code not in self.country_laws:
            self.country_laws[country_code] = []
        
        self.country_laws[country_code].append(law_data)
        logger.info(f"تم إضافة قانون جديد للدولة {country_code}")
    
    def get_supported_countries(self) -> List[str]:
        """الحصول على الدول المدعومة"""
        return list(self.country_laws.keys())