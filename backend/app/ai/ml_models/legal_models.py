# هذا الملف للنماذج المتخصصة في المجال القانوني
from typing import Dict, Any, List
import torch.nn as nn
import logging
from typing import Dict, Any, List
import re

logger = logging.getLogger(__name__)

class LegalBERTModel(nn.Module):
    """نموذج BERT مخصص للمجال القانوني"""
    
    def __init__(self, base_model, num_labels: int = 10):
        super().__init__()
        self.base_model = base_model
        self.classifier = nn.Linear(base_model.config.hidden_size, num_labels)
        
    def forward(self, input_ids, attention_mask):
        outputs = self.base_model(input_ids=input_ids, attention_mask=attention_mask)
        return self.classifier(outputs.last_hidden_state[:, 0, :])

class LegalQAModel:
    """نموذج محاكاة متقدم للسؤال والإجابة - بدون مكتبات خارجية"""
    
    def __init__(self, model_name: str = "legal-qa-model"):
        self.model_name = model_name
        self.country_specific_knowledge = self._initialize_knowledge()
    
    def _initialize_knowledge(self) -> Dict[str, Dict]:
        """تهيئة المعرفة القانونية لكل دولة"""
        return {
            'SA': {
                'عقوبة السرقة': {
                    'answer': 'عقوبة السرقة في النظام السعودي تتراوح بين القطع والجلد والسجن حسب قيمة المسروق وتكرار الجريمة وظروفها.',
                    'confidence': 0.88,
                    'citations': ['نظام العقوبات السعودي - المادة 1', 'نظام الإجراءات الجزائية']
                },
                'شروط رفع الدعوى': {
                    'answer': 'يشترط لرفع الدعوى وجود مصلحة مشروعة للمدعي، وتحديد المدعى عليه بوضوح، وتقديم الأدلة والمستندات اللازمة.',
                    'confidence': 0.85,
                    'citations': ['نظام المرافعات الشرعية - المادة 2']
                },
                'فسخ العقد': {
                    'answer': 'فسخ العقد يكون بالتراضي أو بحكم القضاء في حال الإخلال بالشروط أو استحالة التنفيذ.',
                    'confidence': 0.82,
                    'citations': ['النظام التجاري - المادة 50']
                }
            },
            'AE': {
                'عقوبة السرقة': {
                    'answer': 'عقوبة السرقة في القانون الإماراتي تصل إلى السجن والغرامة المالية حسب ظروف الجريمة وقيمة المسروق.',
                    'confidence': 0.86,
                    'citations': ['القانون الاتحادي رقم 3 لسنة 1987 - المادة 1']
                },
                'مدة التقادم': {
                    'answer': 'مدة التقادم في الدعاوى المدنية تختلف حسب نوع الحق، وتتراوح عادة بين 3 إلى 15 سنة.',
                    'confidence': 0.84,
                    'citations': ['القانون المدني الإماراتي - المادة 20']
                }
            },
            'EG': {
                'عقوبة السرقة': {
                    'answer': 'عقوبة السرقة في القانون المصري تتراوح بين الحبس والغرامة حسب ظروف الجريمة وقيمة المسروق.',
                    'confidence': 0.83,
                    'citations': ['قانون العقوبات المصري - المادة 311']
                },
                'التعويض': {
                    'answer': 'يحق للمتضرر المطالبة بالتعويض عن الأضرار المادية والمعنوية الناتجة عن الفعل الضار.',
                    'confidence': 0.81,
                    'citations': ['القانون المدني المصري - المادة 163']
                }
            }
        }
    
    def _extract_keywords(self, question: str) -> List[str]:
        """استخراج الكلمات المفتاحية من السؤال"""
        # كلمات قانونية شائعة
        legal_terms = [
            'عقوبة', 'سرقة', 'قتل', 'دعوى', 'عقد', 'فسخ', 'تعويض', 'تقادم',
            'جريمة', 'تحقيق', 'حكم', 'استئناف', 'قضية', 'محكمة', 'قاضي'
        ]
        
        found_keywords = []
        for term in legal_terms:
            if term in question:
                found_keywords.append(term)
        
        return found_keywords
    
    def _find_best_match(self, question: str, country_code: str) -> Dict[str, Any]:
        """البحث عن أفضل تطابق للمعرفة"""
        keywords = self._extract_keywords(question)
        country_knowledge = self.country_specific_knowledge.get(country_code, {})
        
        best_match = None
        best_score = 0
        
        for topic, knowledge in country_knowledge.items():
            score = 0
            # حساب نقاط التطابق
            for keyword in keywords:
                if keyword in topic:
                    score += 2
                if keyword in knowledge['answer']:
                    score += 1
            
            if score > best_score:
                best_score = score
                best_match = knowledge
        
        return best_match
    
    def predict(self, question: str, context: str = "", country_code: str = "SA") -> Dict[str, Any]:
        """توقع إجابة لسؤال قانوني - محاكاة متقدمة"""
        
        logger.info(f"معالجة سؤال للدولة {country_code}: {question}")
        
        # البحث عن أفضل تطابق
        best_match = self._find_best_match(question, country_code)
        
        if best_match:
            return best_match
        else:
            # رد افتراضي إذا لم يوجد تطابق
            return {
                'answer': f'شكراً لسؤالك حول "{question}". بناءً على قوانين {country_code}، هذه المسألة تحتاج لمزيد من التخصص. يوصى بالاستعانة بمستشار قانوني متخصص.',
                'confidence': 0.65,
                'citations': [f'القوانين الأساسية لـ{country_code}']
            }
    
    def get_model_info(self) -> Dict[str, Any]:
        """الحصول على معلومات النموذج"""
        return {
            "model_name": self.model_name,
            "type": "محاكاة قانونية",
            "version": "1.0",
            "supported_countries": list(self.country_specific_knowledge.keys()),
            "total_topics": sum(len(topics) for topics in self.country_specific_knowledge.values())
        }