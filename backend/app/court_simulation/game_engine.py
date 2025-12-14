# backend/app/court_simulation/game_engine.py
from random import random
from typing import Dict
from backend.app.court_simulation.ai_judge import AIJudge
from backend.app.court_simulation.ai_litigant import AILitigant
from backend.app.court_simulation.scenario_generator import ScenarioGenerator
from backend.app.court_simulation.voice_system import VoiceSystem


class CourtSimulationGameEngine:
    def __init__(self):
        self.scenario_gen = ScenarioGenerator()
        self.judge = AIJudge()
        self.litigant = AILitigant() 
        self.voice_system = VoiceSystem()
        self.active_sessions = {}
        
    async def start_immersive_session(self, user_profile: Dict) -> Dict:
        """بدء جلسة غامرة كاملة"""
        
        # توليد سيناريو ديناميكي
        scenario = await self.scenario_gen.generate_dynamic_scenario(
            user_profile.get("preferred_case_type", "تجاري"),
            user_profile.get("skill_level", "مبتدئ")
        )
        
        # إنشاء جلسة تفاعلية
        session = {
            "scenario": scenario,
            "user_profile": user_profile,
            "current_phase": "opening_statements",
            "score": 100,
            "time_remaining": 1800,  # 30 دقيقة
            "character_interactions": [],
            "evidence_used": [],
            "surprise_events": [],
            "performance_metrics": {
                "persuasion": 0,
                "legal_knowledge": 0, 
                "courtroom_etiquette": 0,
                "quick_thinking": 0
            }
        }
        
        session_id = self._generate_session_id()
        self.active_sessions[session_id] = session
        
        return {
            "session_id": session_id,
            "scenario": scenario,
            "instructions": "🎮 استعد للمحاكمة! لديك 30 دقيقة لإثبات قضيتك."
        }
    
    async def handle_user_action(self, session_id: str, action: Dict) -> Dict:
        """معالجة إجراءات المستخدم في المحاكاة"""
        session = self.active_sessions.get(session_id)
        if not session:
            return {"error": "الجلسة غير موجودة"}
        
        action_type = action.get("type")
        
        if action_type == "voice_response":
            # تحويل الصوت إلى نص
            user_speech = await self.voice_system.speech_to_text()
            return await self._process_verbal_response(session, user_speech)
            
        elif action_type == "present_evidence":
            return await self._process_evidence_presentation(session, action["evidence_id"])
            
        elif action_type == "objection":
            return await self._process_objection(session, action["reason"])
            
        elif action_type == "examine_witness":
            return await self._process_witness_examination(session, action["witness_id"])
    
    async def _process_verbal_response(self, session: Dict, user_speech: str) -> Dict:
        """معالجة الرد اللفظي للمستخدم"""
        # القاضي يحلل الرد
        judge_feedback = await self.judge.analyze_argument(user_speech, session)
        
        # المدعي يرد
        litigant_response = await self.litigant.counter_argument(user_speech, session)
        
        # تحديث النقاط
        score_change = self._calculate_score_change(user_speech, judge_feedback)
        session["score"] += score_change
        
        # محاكاة ردود الشخصيات بالصوت
        character_responses = []
        for character in session["scenario"]["characters"]:
            if random.random() > 0.7:  # 30% فرصة لرد الشخصية
                response = await self._generate_character_response(character, user_speech)
                character_responses.append({
                    "character": character["name"],
                    "response": response,
                    "audio": await self.voice_system.text_to_speech(response, character)
                })
        
        return {
            "judge_feedback": judge_feedback,
            "litigant_response": litigant_response, 
            "character_responses": character_responses,
            "score_change": score_change,
            "new_score": session["score"],
            "suggestions": await self._generate_suggestions(user_speech)
        }
    
    async def _trigger_surprise_event(self, session: Dict) -> Dict:
        """تفعيل حدث مفاجئ في الجلسة"""
        if session["surprise_events"] and random.random() > 0.8:
            event = random.choice(session["scenario"]["twists"])
            return {
                "type": "surprise_event",
                "message": f"🔄 حدث مفاجئ: {event}",
                "impact": random.choice(["positive", "negative", "neutral"]),
                "audio_effect": "surprise_sound"
            }
        return None