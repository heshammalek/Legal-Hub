# backend/app/court_simulation/performance_analyzer.py
from datetime import datetime
from typing import Dict, List, Any
import json

class PerformanceAnalyzer:
    """
    محلل أداء متقدم لتقييم أداء المحامي في المحاكاة
    """
    
    def __init__(self):
        self.metrics_history = []
        
    async def analyze_response_quality(self, user_response: str, context: Dict) -> Dict[str, Any]:
        """تحليل جودة رد المحامي"""
        
        analysis = {
            "legal_accuracy": self._evaluate_legal_accuracy(user_response, context),
            "argument_strength": self._evaluate_argument_strength(user_response),
            "clarity_and_structure": self._evaluate_clarity(user_response),
            "evidence_usage": self._evaluate_evidence_usage(user_response, context),
            "response_time": context.get("response_time", 0)
        }
        
        # حساب النتيجة الإجمالية
        analysis["overall_score"] = self._calculate_overall_score(analysis)
        analysis["feedback"] = self._generate_feedback(analysis, user_response)
        
        return analysis
    
    def _evaluate_legal_accuracy(self, response: str, context: Dict) -> float:
        """تقييم الدقة القانونية (0-100)"""
        # مؤقتاً - إرجاع قيمة افتراضية
        legal_terms = ["المادة", "القانون", "السابقة", "الحكم", "الدفاع", "الإثبات"]
        found_terms = sum(1 for term in legal_terms if term in response)
        return min(100, (found_terms / len(legal_terms)) * 100)
    
    def _evaluate_argument_strength(self, response: str) -> float:
        """تقييم قوة الحجة (0-100)"""
        # تحليل هيكل الحجة
        argument_indicators = ["لذلك", "وبالتالي", "بناءً على", "مما يثبت", "يدل على"]
        indicators_count = sum(1 for indicator in argument_indicators if indicator in response)
        
        # حساب الطول النسبي
        word_count = len(response.split())
        length_score = min(100, (word_count / 50) * 100)  # 50 كلمة هدف
        
        return (indicators_count * 20 + length_score * 0.3)
    
    def _evaluate_clarity(self, response: str) -> float:
        """تقييم الوضوح والتنظيم (0-100)"""
        # مؤشرات التنظيم
        structure_indicators = ["أولاً", "ثانياً", "ختاماً", "من ناحية", "من ناحية أخرى"]
        structure_score = sum(1 for indicator in structure_indicators if indicator in response) * 15
        
        # نقاط الوضوح
        clarity_score = min(100, structure_score + 40)  # درجة أساسية + هيكل
        
        return clarity_score
    
    def _evaluate_evidence_usage(self, response: str, context: Dict) -> float:
        """تقييم استخدام الأدلة (0-100)"""
        evidence_terms = ["الدليل", "الوثيقة", "الإثبات", "البينة", "الشهادة"]
        evidence_count = sum(1 for term in evidence_terms if term in response)
        
        # إذا كان هناك أدلة في السياق وتحقق من استخدامها
        available_evidence = context.get("available_evidence", [])
        if available_evidence:
            used_evidence = sum(1 for evidence in available_evidence if evidence in response)
            evidence_score = (used_evidence / len(available_evidence)) * 50
        
        return min(100, (evidence_count * 20) + evidence_score)
    
    def _calculate_overall_score(self, analysis: Dict) -> float:
        """حساب النتيجة الإجمالية مع أوزان مختلفة"""
        weights = {
            "legal_accuracy": 0.35,
            "argument_strength": 0.25,
            "clarity_and_structure": 0.20,
            "evidence_usage": 0.20
        }
        
        overall_score = 0
        for metric, weight in weights.items():
            overall_score += analysis[metric] * weight
        
        return round(overall_score, 2)
    
    def _generate_feedback(self, analysis: Dict, response: str) -> List[str]:
        """توليد تعليقات بناءً على التحليل"""
        feedback = []
        
        if analysis["legal_accuracy"] < 60:
            feedback.append("💡 تحتاج لاستخدام مصطلحات قانونية أكثر دقة")
        
        if analysis["argument_strength"] < 50:
            feedback.append("💡 حججك تحتاج لمزيد من القوة والمنطق")
            
        if analysis["clarity_and_structure"] < 60:
            feedback.append("💡 رتب أفكارك بشكل أفضل باستخدام عناصر ترقيم")
            
        if analysis["evidence_usage"] < 40:
            feedback.append("💡 استخدم الأدلة المتاحة بشكل أكثر فعالية")
            
        if analysis["overall_score"] >= 80:
            feedback.append("🎉 أداء ممتاز! استمر في هذا المستوى")
        elif analysis["overall_score"] >= 60:
            feedback.append("👍 أداء جيد، مع إمكانية التحسين")
        else:
            feedback.append("📚 تحتاج لمزيد من التدريب والممارسة")
            
        return feedback
    
    async def track_session_performance(self, session_id: str, responses: List[Dict]):
        """تتبع أداء الجلسة كاملة"""
        session_metrics = {
            "session_id": session_id,
            "start_time": datetime.now(),
            "total_responses": len(responses),
            "average_score": 0,
            "improvement_trend": False,
            "weak_areas": []
        }
        
        if responses:
            scores = [resp.get("analysis", {}).get("overall_score", 0) for resp in responses]
            session_metrics["average_score"] = sum(scores) / len(scores)
            
            # تحليل اتجاه التحسن
            if len(scores) > 1:
                session_metrics["improvement_trend"] = scores[-1] > scores[0]
            
            # تحديد نقاط الضعف
            weak_areas = self._identify_weak_areas(responses)
            session_metrics["weak_areas"] = weak_areas
        
        self.metrics_history.append(session_metrics)
        return session_metrics
    
    def _identify_weak_areas(self, responses: List[Dict]) -> List[str]:
        """تحديد مجالات الضعف المتكررة"""
        area_scores = {
            "legal_accuracy": [],
            "argument_strength": [],
            "clarity_and_structure": [],
            "evidence_usage": []
        }
        
        for response in responses:
            analysis = response.get("analysis", {})
            for area in area_scores.keys():
                if area in analysis:
                    area_scores[area].append(analysis[area])
        
        weak_areas = []
        for area, scores in area_scores.items():
            if scores and sum(scores) / len(scores) < 60:
                weak_areas.append(area)
                
        return weak_areas
    
    def get_performance_report(self, session_id: str) -> Dict:
        """إعداد تقرير أداء مفصل"""
        session_data = next((s for s in self.metrics_history if s["session_id"] == session_id), None)
        
        if not session_data:
            return {"error": "لم يتم العثور على بيانات الجلسة"}
        
        report = {
            "session_summary": session_data,
            "recommendations": self._generate_recommendations(session_data),
            "comparison_to_previous": self._compare_with_previous(session_id),
            "next_steps": self._suggest_next_steps(session_data)
        }
        
        return report
    
    def _generate_recommendations(self, session_data: Dict) -> List[str]:
        """توليد توصيات بناءً على نقاط الضعف"""
        recommendations = []
        weak_areas = session_data.get("weak_areas", [])
        
        area_recommendations = {
            "legal_accuracy": ["ادرس التشريعات ذات الصلة", "راجع السوابق القضائية"],
            "argument_strength": ["تدرب على بناء الحجج المنطقية", "تعلم تقنيات الإقناع"],
            "clarity_and_structure": ["رتب أفكارك قبل التحدث", "استخدم عناصر الترقيم"],
            "evidence_usage": ["تعلم كيفية الاستشهاد بالأدلة", "راجع قواعد الإثبات"]
        }
        
        for area in weak_areas:
            if area in area_recommendations:
                recommendations.extend(area_recommendations[area])
                
        return recommendations
    
    def _compare_with_previous(self, current_session_id: str) -> Dict:
        """مقارنة مع الجلسات السابقة"""
        current_index = next(i for i, s in enumerate(self.metrics_history) if s["session_id"] == current_session_id)
        
        if current_index > 0:
            previous_session = self.metrics_history[current_index - 1]
            current_session = self.metrics_history[current_index]
            
            return {
                "score_change": current_session["average_score"] - previous_session["average_score"],
                "improvement": current_session["average_score"] > previous_session["average_score"],
                "message": f"تحسن بمقدار {current_session['average_score'] - previous_session['average_score']:.1f} نقطة" 
                if current_session["average_score"] > previous_session["average_score"] 
                else "انخفاض في الأداء"
            }
        
        return {"message": "هذه أول جلسة لك"}
    
    def _suggest_next_steps(self, session_data: Dict) -> List[str]:
        """اقتراح الخطوات التالية للتحسين"""
        score = session_data.get("average_score", 0)
        
        if score >= 80:
            return ["جرب قضايا أكثر تعقيداً", "تدرب على المحاكمات المتقدمة"]
        elif score >= 60:
            return ["راجع نقاط الضعف", "جرب نفس النوع من القضايا مرة أخرى"]
        else:
            return ["ابدأ بقضايا بسيطة", "راجع الأساسيات القانونية", "تدرب على بناء الحجج"]