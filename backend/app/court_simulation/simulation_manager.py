# backend/app/court_simulation/simulation_manager.py
from app.court_simulation.ai_judge import AIJudge
from app.court_simulation.ai_litigant import AILitigant
from app.court_simulation.scenario_generator import ScenarioGenerator


class CourtSimulationManager:
    def __init__(self):
        self.judge = AIJudge()
        self.litigant = AILitigant()
        self.scenario_generator = ScenarioGenerator()
    
    async def start_simulation(self, case_type: str, difficulty: str):
        """بدء جلسة محاكاة جديدة"""
        # توليد سيناريو عشوائي
        scenario = await self.scenario_generator.generate_scenario(
            case_type=case_type,
            difficulty=difficulty
        )
        
        # المدعي يطرح الإشكالات الأولية
        initial_issues = await self.litigant.generate_legal_issue(
            scenario, difficulty
        )
        
        return {
            "scenario": scenario,
            "initial_issues": initial_issues,
            "session_id": self._generate_session_id()
        }
    
    async def process_lawyer_response(self, session_id: str, lawyer_response: str):
        """معالجة رد المحامي"""
        # القاضي يحلل الرد
        judge_feedback = await self.judge.analyze_argument(
            lawyer_response, self._get_session_context(session_id)
        )
        
        # المدعي يرد على الحجة
        litigant_counter = await self.litigant.counter_argument(
            lawyer_response, self._get_session_context(session_id)
        )
        
        return {
            "judge_feedback": judge_feedback,
            "litigant_counter": litigant_counter,
            "suggested_improvements": await self._suggest_improvements(lawyer_response)
        }