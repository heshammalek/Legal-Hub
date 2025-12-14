# backend/app/court_simulation/ai_litigant.py
from app.ai_advisor.core.multi_llm_orchestrator import MultiLLMOrchestrator


class AILitigant:
    def __init__(self):
        llm_config = {
            "models": {
                "primary": {
                    "provider": "openai", 
                    "model_name": "gpt-4"
                }
            }
        }
        
        self.llm_orchestrator = MultiLLMOrchestrator(config=llm_config)
    
    async def generate_legal_issue(self, case_scenario: dict, difficulty: str):
        """توليد إشكالات قانونية بناءً على السيناريو"""
        issue_prompt = f"""
        أنت مدعٍ في قضية {case_scenario['type']} مع التعقيد {difficulty}.
        الوقائع: {case_scenario['facts']}
        
        قم بطرح 3 إشكالات قانونية رئيسية تضع المحامي في موقف صعب.
        """
        
        return await self.llm_orchestrator.generate_response(
            system_prompt="أنت مدعٍ محترف تبحث عن الثغرات القانونية",
            human_prompt=issue_prompt
        )
    
    async def counter_argument(self, lawyer_argument: str, case_context: dict):
        """رد المدعي على حجج المحامي"""
        counter_prompt = f"""
        المحامي قدم الحجة التالية: {lawyer_argument}
        السياق: {case_context}
        
        قم بصياغة رد قوي يضعف حجة المحامي.
        """
        
        return await self.llm_orchestrator.generate_response(
            system_prompt="أنت مدعٍ يحاول إثبات وجهة نظره",
            human_prompt=counter_prompt
        )