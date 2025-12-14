# backend/app/court_simulation/scenario_generator.py
import random
from typing import Dict, List
from app.ai_advisor.core.multi_llm_orchestrator import MultiLLMOrchestrator


llm_config = {
    "model_name": "gpt-3.5-turbo",  # or your preferred model
    "temperature": 0.7,
    "max_tokens": 2000,
    # Add other necessary configuration parameters
}

class ScenarioGenerator:
    def __init__(self):
        self.llm_orchestrator = MultiLLMOrchestrator(config=llm_config)
        
    async def generate_dynamic_scenario(self, case_type: str, difficulty: str) -> Dict:
        """توليد سيناريو ديناميكي مع شخصيات متعددة"""
        
        scenario_prompt = f"""
        أنت كاتب سيناريوهات قانونية محترف. أنشئ سيناريو قضائي واقعي:
        
        نوع القضية: {case_type}
        مستوى الصعوبة: {difficulty}
        
        المطلوب:
        1. وقائع القضية الرئيسية (300 كلمة)
        2. 3 شخصيات رئيسية مع خلفيات وصفات
        3. 5 أدلة رئيسية (بعضها مضلل)
        4. 3 إشكالات قانونية رئيسية
        5. تطورات مفاجئة محتملة
        
        أعد الإجابة بتنسيق JSON منظم.
        """
        
        scenario = await self.llm_orchestrator.generate_response(
            system_prompt="أنت كاتب سيناريوهات قانونية واقعية",
            human_prompt=scenario_prompt
        )
        
        return self._parse_scenario_response(scenario)
    
    def _parse_scenario_response(self, response: str) -> Dict:
        """تحليل استجابة الـ LLM إلى هيكل منظم"""
        # هنا يمكن إضافة منطق parsing متقدم
        return {
            "facts": "وقائع القضية...",
            "characters": [
                {
                    "name": "المدعي - أحمد السيد",
                    "role": "مدعي",
                    "personality": "عدواني، متسرع",
                    "background": "رجل أعمال خسر استثماراً كبيراً",
                    "voice_profile": "deep_aggressive"
                },
                {
                    "name": "المدعى عليه - د. محمد عبد الرحمن", 
                    "role": "مدعى عليه",
                    "personality": "هادئ، متعجرف",
                    "background": "خبير استثماري معروف",
                    "voice_profile": "calm_arrogant"
                },
                {
                    "name": "الشاهد - منى محمود",
                    "role": "شاهد",
                    "personality": "متوتر، صادق",
                    "background": "موظفة في الشركة",
                    "voice_profile": "nervous_honest"
                }
            ],
            "evidence": [
                {"type": "عقد", "content": "عقد شراكة موقع", "reliable": True},
                {"type": "بريد إلكتروني", "content": "مراسلات داخلية", "reliable": True},
                {"type": "تقرير مالي", "content": "أرقام مشكوك فيها", "reliable": False},
                {"type": "شهادة شاهد", "content": "رواية متضاربة", "reliable": False}
            ],
            "legal_issues": [
                "خرق العقد والإخلال بالالتزامات",
                "الغش والخداع في المعاملة", 
                "الإهمال المهني"
            ],
            "twists": [
                "شهادة مفاجئة من شاهد غير متوقع",
                "ظهور دليل جديد في منتصف الجلسة",
                "اعتراف غير متوقع من أحد الأطراف"
            ]
        }