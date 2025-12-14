import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class CountryLaws:
    def __init__(self):
        self.laws_database = self._initialize_laws_database()
    
    def _initialize_laws_database(self) -> Dict[str, List[Dict]]:
        """تهيئة قاعدة بيانات القوانين"""
        
        return {
            'SA': [
                {
                    'id': 'sa_constitution',
                    'name': 'النظام الأساسي للحكم',
                    'type': 'دستوري',
                    'articles': [
                        {
                            'number': '1',
                            'text': 'المملكة العربية السعودية دولة عربية إسلامية ذات سيادة تامة؛ دينها الإسلام، ودستورها كتاب الله تعالى وسنة رسوله صلى الله عليه وسلم.',
                            'category': 'أساسي'
                        }
                    ],
                    'keywords': ['دستور', 'أساسي', 'حكم']
                },
                {
                    'id': 'sa_penal_code',
                    'name': 'نظام العقوبات',
                    'type': 'جنائي',
                    'articles': [
                        {
                            'number': '1',
                            'text': 'لا جريمة ولا عقوبة إلا بنص شرعي أو نظامي.',
                            'category': 'أساسي'
                        }
                    ],
                    'keywords': ['عقوبة', 'جريمة', 'جنائي']
                }
            ],
            'AE': [
                {
                    'id': 'ae_constition',
                    'name': 'الدستور الإماراتي',
                    'type': 'دستوري',
                    'articles': [
                        {
                            'number': '1',
                            'text': 'الإمارات العربية المتحدة دولة اتحادية مستقلة ذات سيادة، ويشار إليها في هذا الدستور بالاتحاد.',
                            'category': 'أساسي'
                        }
                    ],
                    'keywords': ['دستور', 'اتحادي']
                }
            ]
        }
    
    def get_laws_by_country(self, country_code: str, law_type: str = None) -> List[Dict]:
        """الحصول على قوانين دولة معينة"""
        
        if country_code not in self.laws_database:
            return []
        
        laws = self.laws_database[country_code]
        
        if law_type:
            laws = [law for law in laws if law['type'] == law_type]
        
        return laws
    
    def search_laws(self, query: str, country_code: str = None) -> List[Dict]:
        """البحث في القوانين"""
        
        results = []
        countries_to_search = [country_code] if country_code else self.laws_database.keys()
        
        for code in countries_to_search:
            for law in self.laws_database.get(code, []):
                # البحث في النص والكلمات المفتاحية
                if (query in law['name'] or 
                    any(query in article['text'] for article in law['articles']) or
                    any(query in keyword for keyword in law.get('keywords', []))):
                    
                    results.append({
                        'country_code': code,
                        'law': law,
                        'relevance': 'high'  # يمكن تطوير خوارزمية تقييم
                    })
        
        return results
    
    def get_law_article(self, country_code: str, law_id: str, article_number: str) -> Optional[Dict]:
        """الحصول على مادة قانونية محددة"""
        
        laws = self.laws_database.get(country_code, [])
        for law in laws:
            if law['id'] == law_id:
                for article in law['articles']:
                    if article['number'] == article_number:
                        return {
                            'country_code': country_code,
                            'law_name': law['name'],
                            'article': article
                        }
        
        return None