# backend/app/court_simulation/ai_judge.py
from app.ai_advisor.rag.semantic_retriever import SemanticRetriever
from app.ai_advisor.core.multi_llm_orchestrator import MultiLLMOrchestrator

class AIJudge:
    def __init__(self):
        llm_config = {
            "models": {
                "primary": {
                    "provider": "openai",
                    "model_name": "gpt-4"
                }
            }
        }

        self.retriever = SemanticRetriever(database_url="postgresql+asyncpg://postgres:123456@localhost:5432/legal_ai")  # من RAG system
        self.llm_orchestrator = MultiLLMOrchestrator(config=llm_config)  # من multi-LLM
    
    async def analyze_argument(self, user_argument: str, case_context: dict):
        """تحليل حجة المحامي باستخدام RAG"""
        # البحث في السوابق القضائية
        precedents = await self.retriever.search_legal_precedents(
            query=user_argument,
            filters={"type": "case_law"}
        )
        
        # توليد أسئلة القاضي بناءً على الحجة والسياق
        judge_questions = await self._generate_questions(
            argument=user_argument,
            precedents=precedents,
            context=case_context
        )
        
        return judge_questions
    
    async def evaluate_performance(self, user_responses: list, case_type: str):
        """تقييم أداء المحامي"""
        # استخدام الـ LLM لتقييم الأداء
        evaluation_prompt = f"""
        قم بتقييم أداء المحامي بناءً على:
        - الردود: {user_responses}
        - نوع القضية: {case_type}
        
        اعد التقييم بنقاط من 100 مع تعليقات مفصلة.
        """
        
        return await self.llm_orchestrator.generate_response(
            system_prompt="أنت قاضٍ خبير في تقييم أداء المحامين",
            human_prompt=evaluation_prompt
        )