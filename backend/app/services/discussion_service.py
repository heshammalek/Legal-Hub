from sqlmodel import Session
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import logging
from fastapi import HTTPException

from app.database.discussion_crud import DiscussionCRUD

logger = logging.getLogger(__name__)

class DiscussionService:
    
    @staticmethod
    def calculate_engagement_score(question) -> float:
        """حساب درجة المشاركة للسؤال"""
        try:
            base_score = question.answers_count * 2
            vote_score = question.upvotes_count * 1.5
            view_score = min(question.views_count / 10, 50)
            follower_score = question.followers_count * 3
            share_score = question.shares_count * 2
            
            total_score = base_score + vote_score + view_score + follower_score + share_score
            
            # تضاؤل زمني
            hours_old = (datetime.utcnow() - question.created_at).total_seconds() / 3600
            time_decay = 0.95 ** (hours_old / 24)  # تضاؤل 5% يومياً
            
            final_score = total_score * time_decay
            return round(final_score, 2)
            
        except Exception as e:
            logger.error(f"Error calculating engagement score: {str(e)}")
            return 0.0
    
    @staticmethod
    def create_question(db: Session, question_data: Dict, author_id: str, author_role: str):
        """إنشاء سؤال جديد"""
        try:
            logger.info(f"🛠️ بدء إنشاء سؤال - المؤلف: {author_id}")
            logger.info(f"📄 البيانات الخام: {question_data}")
            
            # معالجة الـ tags - قد تأتي كـ JSON string أو list
            raw_tags = question_data.get('tags', [])
            processed_tags = []
            
            if isinstance(raw_tags, str):
                try:
                    # محاولة تحويل JSON string إلى list
                    import json
                    processed_tags = json.loads(raw_tags)
                    if not isinstance(processed_tags, list):
                        processed_tags = []
                except:
                    processed_tags = []
            elif isinstance(raw_tags, list):
                processed_tags = raw_tags
            else:
                processed_tags = []
            
            logger.info(f"🏷️ الـ tags بعد المعالجة: {processed_tags}")
            
            # تنظيف وتحويل البيانات
            clean_question_data = {
                'title': str(question_data.get('title', '')).strip(),
                'content': str(question_data.get('content', '')).strip(),
                'category': str(question_data.get('category', 'قانون مدني')),
                'tags': processed_tags,
                'is_anonymous': bool(question_data.get('is_anonymous', False)),
                'is_urgent': bool(question_data.get('is_urgent', False))
            }
            
            logger.info(f"🧹 البيانات بعد التنظيف: {clean_question_data}")
            
            # التحقق من البيانات
            if len(clean_question_data['title']) < 10:
                raise HTTPException(status_code=400, detail="عنوان السؤال يجب أن يكون至少 10 أحرف")
            
            if len(clean_question_data['content']) < 20:
                raise HTTPException(status_code=400, detail="محتوى السؤال يجب أن يكون至少 20 حرف")
            
            # استخدام CRUD لإنشاء السؤال
            question = DiscussionCRUD.create_question(db, clean_question_data, author_id, author_role)
            logger.info(f"✅ تم إنشاء سؤال جديد: {question.id}")
            return question
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ فشل في إنشاء السؤال: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"فشل في إنشاء السؤال: {str(e)}")
    
    @staticmethod
    def get_questions(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        filters: Optional[Dict] = None,
        search_query: Optional[str] = None,
        current_user_id: Optional[str] = None
    ) -> Tuple[List[Any], int, Dict[str, int]]:
        """جلب الأسئلة مع الفلاتر"""
        try:
            # تحويل الفلاتر
            category = filters.get('category') if filters else None
            status = filters.get('status') if filters else None
            sort_by = filters.get('sort_by', 'newest') if filters else 'newest'
            has_accepted_answer = filters.get('has_accepted_answer') if filters else None
            is_urgent = filters.get('is_urgent') if filters else None
            is_featured = filters.get('is_featured') if filters else None
            
            # استخدام CRUD لجلب الأسئلة
            questions, total = DiscussionCRUD.get_questions(
                db=db,
                skip=skip,
                limit=limit,
                category=category,
                status=status,
                search_query=search_query,
                sort_by=sort_by,
                has_accepted_answer=has_accepted_answer,
                is_urgent=is_urgent,
                is_featured=is_featured
            )
            
            # جلب إحصائيات التصنيفات
            category_stats = DiscussionCRUD.get_category_stats(db)
            
            # تحديث درجات المشاركة
            for question in questions:
                question.engagement_score = DiscussionService.calculate_engagement_score(question)
            
            return questions, total, category_stats
            
        except Exception as e:
            logger.error(f"❌ فشل في جلب الأسئلة: {str(e)}")
            # إرجاع بيانات افتراضية بدلاً من خطأ
            from app.models.requests.peer_question import QuestionCategory
            return [], 0, {cat.value: 0 for cat in QuestionCategory}
    
    @staticmethod
    def add_answer(db: Session, answer_data: Dict, author_id: str, author_role: str):
        """إضافة إجابة جديدة"""
        try:
            # استخدام CRUD لإنشاء الإجابة
            answer = DiscussionCRUD.create_answer(db, answer_data, author_id, author_role)
            
            # جلب السؤال وتحديث درجة المشاركة
            question = DiscussionCRUD.get_question_by_id(db, answer_data['question_id'])
            if question:
                question.engagement_score = DiscussionService.calculate_engagement_score(question)
                db.commit()
            
            logger.info(f"✅ تم إضافة إجابة جديدة: {answer.id}")
            return answer
            
        except Exception as e:
            logger.error(f"❌ فشل في إضافة الإجابة: {str(e)}")
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail="فشل في إضافة الإجابة")
    
    @staticmethod
    def follow_question(db: Session, question_id: str, user_id: str):
        """متابعة سؤال"""
        try:
            return DiscussionCRUD.follow_question(db, question_id, user_id)
        except Exception as e:
            logger.error(f"❌ فشل في متابعة السؤال: {str(e)}")
            raise HTTPException(status_code=500, detail="فشل في متابعة السؤال")
    
    @staticmethod
    def vote_answer(db: Session, answer_id: str, user_id: str, vote_type: str):
        """التصويت على إجابة"""
        try:
            return DiscussionCRUD.vote_answer(db, answer_id, user_id, vote_type)
        except Exception as e:
            logger.error(f"❌ فشل في التصويت: {str(e)}")
            raise HTTPException(status_code=500, detail="فشل في التصويت")
    
    @staticmethod
    def get_question_answers(db: Session, question_id: str):
        """جلب إجابات سؤال معين"""
        try:
            return DiscussionCRUD.get_answers_for_question(db, question_id)
        except Exception as e:
            logger.error(f"❌ فشل في جلب إجابات السؤال: {str(e)}")
            return []
    
    @staticmethod
    def get_discussion_stats(db: Session):
        """جلب إحصائيات المناقشات"""
        try:
            return DiscussionCRUD.get_question_stats(db)
        except Exception as e:
            logger.error(f"❌ فشل في جلب الإحصائيات: {str(e)}")
            from app.models.requests.peer_question import QuestionCategory
            return {
                'total_questions': 0,
                'total_answers': 0,
                'resolved_questions': 0,
                'active_questions': 0,
                'categories': {cat.value: 0 for cat in QuestionCategory}
            }