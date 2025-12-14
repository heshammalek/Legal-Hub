from sqlmodel import Session, select, func
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class ReputationService:
    
    @staticmethod
    def calculate_user_reputation(db: Session, user_id: str) -> Dict[str, any]:
        """حساب سمعة المستخدم وإحصائياته"""
        from app.models.requests.peer_question import PeerQuestion
        from app.models.requests.peer_answer import PeerAnswer
        
        try:
            # إحصائيات الأسئلة
            questions_stats = db.exec(
                select(
                    func.count(PeerQuestion.id).label('total_questions'),
                    func.sum(PeerQuestion.views_count).label('total_views'),
                    func.sum(PeerQuestion.upvotes_count).label('total_question_upvotes'),
                    func.avg(PeerQuestion.engagement_score).label('avg_engagement')
                ).where(PeerQuestion.author_id == user_id)
            ).one()
            
            # إحصائيات الإجابات
            answers_stats = db.exec(
                select(
                    func.count(PeerAnswer.id).label('total_answers'),
                    func.sum(PeerAnswer.upvotes_count).label('total_answer_upvotes'),
                    func.sum(PeerAnswer.helpful_score).label('total_helpful_score'),
                    func.avg(PeerAnswer.quality_score).label('avg_quality'),
                    func.count(PeerAnswer.id).filter(PeerAnswer.is_accepted == True).label('accepted_answers')
                ).where(PeerAnswer.author_id == user_id)
            ).one()
            
            # حساب النقاط
            question_points = (questions_stats.total_questions or 0) * 5
            answer_points = (answers_stats.total_answers or 0) * 10
            accepted_points = (answers_stats.accepted_answers or 0) * 50
            upvote_points = ((questions_stats.total_question_upvotes or 0) + (answers_stats.total_answer_upvotes or 0)) * 2
            helpful_points = (answers_stats.total_helpful_score or 0) * 3
            
            total_score = question_points + answer_points + accepted_points + upvote_points + helpful_points
            
            # تحديد الشارة
            badge = ReputationService.determine_badge(total_score)
            
            return {
                'reputation_score': min(total_score, 1000),
                'badge': badge,
                'stats': {
                    'total_questions': questions_stats.total_questions or 0,
                    'total_answers': answers_stats.total_answers or 0,
                    'accepted_answers': answers_stats.accepted_answers or 0,
                    'total_views': questions_stats.total_views or 0,
                    'total_upvotes': (questions_stats.total_question_upvotes or 0) + (answers_stats.total_answer_upvotes or 0)
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating user reputation: {str(e)}")
            return {
                'reputation_score': 0,
                'badge': 'مبتدئ',
                'stats': {
                    'total_questions': 0,
                    'total_answers': 0,
                    'accepted_answers': 0,
                    'total_views': 0,
                    'total_upvotes': 0
                }
            }
    
    @staticmethod
    def determine_badge(score: int) -> str:
        """تحديد الشارة بناءً على النقاط"""
        if score >= 1000:
            return "أسطورة"
        elif score >= 500:
            return "خبير"
        elif score >= 250:
            return "متميز"
        elif score >= 100:
            return "نشط"
        elif score >= 50:
            return "مشارك"
        else:
            return "مبتدئ"