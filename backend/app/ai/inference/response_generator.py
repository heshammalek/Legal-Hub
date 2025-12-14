import logging
import json
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class ResponseGenerator:
    def __init__(self):
        self.response_templates = self._load_templates()
    
    def _load_templates(self) -> Dict[str, Any]:
        """تحميل قوالب الردود"""
        return {
            'SA': {
                'greeting': "مرحباً! أنا المساعد القانوني المتخصص في الأنظمة السعودية. كيف يمكنني مساعدتك اليوم؟",
                'fallback': "شكراً لاستفسارك. للأسف لا أملك معلومات كافية حول هذا الموضوع حالياً. يوصى بالاستعانة بمستشار قانوني متخصص.",
                'sources': "📚 المصادر: النظام الأساسي للحكم، نظام المرافعات الشرعية، نظام العقوبات"
            },
            'AE': {
                'greeting': "أهلاً وسهلاً! أنا المساعد القانوني المختص بالقوانين الإماراتية. كيف يمكنني خدمتك؟",
                'fallback': "شكراً لسؤالك. هذه المسألة تحتاج لمزيد من التخصص. أنصحك بالتواصل مع محامٍ متخصص في القانون الإماراتي.",
                'sources': "📚 المصادر: الدستور الإماراتي، القانون المدني، قانون العقوبات الاتحادي"
            },
            'EG': {
                'greeting': "مرحباً بك! أنا المساعد القانوني الخبير بالقوانين المصرية. تفضل بسؤالك.",
                'fallback': "شكراً لاستفسارك. هذه القضية تتطلب رأياً قانونياً متخصصاً. يوصى بالرجوع لمحامٍ مختص.",
                'sources': "📚 المصادر: الدستور المصري، القانون المدني، قانون العقوبات"
            }
        }
    
    def generate_response(self, query: str, country_code: str, context: Dict = None) -> Dict[str, Any]:
        """توليد رد ذكي بناءً على الاستفسار"""
        
        try:
            # تحليل الاستفسار
            query_analysis = self._analyze_query(query, country_code)
            
            # توليد الرد المناسب
            response = self._create_legal_response(query, country_code, query_analysis, context)
            
            logger.info(f"تم توليد رد للدولة {country_code} بنجاح")
            return response
            
        except Exception as e:
            logger.error(f"خطأ في توليد الرد: {str(e)}")
            return self._generate_fallback_response(country_code)
    
    def _analyze_query(self, query: str, country_code: str) -> Dict[str, Any]:
        """تحليل الاستفسار القانوني"""
        analysis = {
            'category': 'عام',
            'urgency': 'منخفض',
            'complexity': 'متوسط',
            'keywords': [],
            'needs_specialist': False
        }
        
        # كلمات مفتاحية للتصنيف
        categories = {
            'جنائي': ['جريمة', 'عقوبة', 'سجن', 'سرقة', 'قتل', 'تحقيق', 'نيابة'],
            'مدني': ['عقد', 'تعويض', 'دين', 'ملكية', 'إيجار', 'شركة', 'تجاري'],
            'أحوال شخصية': ['زواج', 'طلاق', 'نفقة', 'حضانة', 'ميراث', 'وصية'],
            'إداري': ['ترخيص', 'رخصة', 'بلدية', 'حكومي', 'موظف', 'تعيين']
        }
        
        for category, keywords in categories.items():
            if any(keyword in query for keyword in keywords):
                analysis['category'] = category
                analysis['keywords'].extend([k for k in keywords if k in query])
        
        # تحديد مستوى التعقيد
        complex_terms = ['استئناف', 'تمييز', 'نقض', 'تحكيم', 'الطعن', 'البت']
        if any(term in query for term in complex_terms):
            analysis['complexity'] = 'عالي'
            analysis['needs_specialist'] = True
        
        return analysis
    
    def _create_legal_response(self, query: str, country_code: str, analysis: Dict, context: Dict) -> Dict[str, Any]:
        """إنشاء رد قانوني متخصص"""
        
        # قاعدة معرفة قانونية مبسطة
        legal_knowledge = {
            'SA': {
                'جنائي': {
                    'عقوبة السرقة': "عقوبة السرقة في النظام السعودي تتراوح بين القطع والجلد والسجن حسب قيمة المسروق وتكرار الجريمة.",
                    'جريمة القتل': "جريمة القتل في النظام السعودي تعاقب بالإعدام أو القصاص حسب نوع القتل وظروفه.",
                },
                'مدني': {
                    'فسخ العقد': "فسخ العقد في النظام السعودي يكون بالتراضي أو بحكم القضاء في حال الإخلال بالشروط.",
                }
            },
            'AE': {
                'جنائي': {
                    'عقوبة السرقة': "عقوبة السرقة في القانون الإماراتي تصل إلى السجن والغرامة المالية حسب ظروف الجريمة.",
                },
                'مدني': {
                    'التعويض': "يحق للمتضرر المطالبة بالتعويض في القانون الإماراتي عن الأضرار المادية والمعنوية.",
                }
            }
        }
        
        # البحث عن إجابة مناسبة
        country_knowledge = legal_knowledge.get(country_code, {})
        category_knowledge = country_knowledge.get(analysis['category'], {})
        
        response_text = ""
        citations = []
        confidence = 0.7  # ثقة افتراضية
        
        for topic, answer in category_knowledge.items():
            if any(keyword in query for keyword in topic.split()):
                response_text = answer
                citations.append(f"نظام العقوبات - {country_code}")
                confidence = 0.85
                break
        
        if not response_text:
            # استخدام رد افتراضي
            template = self.response_templates.get(country_code, self.response_templates['SA'])
            response_text = template['fallback']
            citations = [template['sources']]
            confidence = 0.6
        
        return {
            "answer": response_text,
            "citations": citations,
            "confidence": confidence,
            "analysis": analysis,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _generate_fallback_response(self, country_code: str) -> Dict[str, Any]:
        """توليد رد بديل في حالة الخطأ"""
        template = self.response_templates.get(country_code, self.response_templates['SA'])
        
        return {
            "answer": template['fallback'],
            "citations": [template['sources']],
            "confidence": 0.5,
            "analysis": {"category": "عام", "complexity": "غير معروف"},
            "timestamp": datetime.utcnow().isoformat()
        }