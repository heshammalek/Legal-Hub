from sqlmodel import Session, select, func, desc, asc, or_, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
from uuid import uuid4

logger = logging.getLogger(__name__)

class DiscussionCRUD:
    
    @staticmethod
    def create_question(db: Session, question_data: Dict, author_id: str, author_role: str):
        """إنشاء سؤال جديد في قاعدة البيانات"""
        from app.models.requests.peer_question import PeerQuestion, QuestionCategory
        from app.models.requests.question_follow import QuestionFollow
        
        try:
            logger.info(f"🗃️ محاولة إنشاء سؤال في قاعدة البيانات")
            
            # معالجة التصنيف - تحويل من نص إلى enum
            category_value = question_data['category']
            category_enum = QuestionCategory.OTHER
            
            try:
                # حاول العثور على التصنيف المناسب
                for cat in QuestionCategory:
                    if cat.value == category_value:
                        category_enum = cat
                        break
            except:
                logger.warning(f"⚠️  استخدام التصنيف الافتراضي 'أخرى'")
            
            logger.info(f"📂 التصنيف المستخدم: {category_enum}")
            
            # معالجة الـ tags - تأكد أنها list
            tags = question_data.get('tags', [])
            if not isinstance(tags, list):
                tags = []
            
            # إنشاء السؤال
            question = PeerQuestion(
                title=question_data['title'],
                content=question_data['content'],
                category=category_enum,
                tags=tags,
                is_anonymous=question_data.get('is_anonymous', False),
                is_urgent=question_data.get('is_urgent', False),
                author_id=author_id,
                author_role=author_role,
                engagement_score=10.0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                last_activity_at=datetime.utcnow()
            )
            
            logger.info(f"➕ إضافة السؤال إلى الجلسة: {question.title}")
            db.add(question)
            db.commit()
            db.refresh(question)
            logger.info(f"✅ تم حفظ السؤال في قاعدة البيانات: {question.id}")
            
            # متابعة السؤال تلقائياً
            try:
                follow = QuestionFollow(
                    question_id=question.id,
                    user_id=author_id,
                    created_at=datetime.utcnow()
                )
                db.add(follow)
                question.followers_count += 1
                db.commit()
                db.refresh(question)
                logger.info(f"✅ تمت متابعة السؤال تلقائياً")
            except Exception as e:
                logger.warning(f"⚠️  فشل في متابعة السؤال تلقائياً: {e}")
            
            return question
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ فشل في إنشاء السؤال في قاعدة البيانات: {str(e)}", exc_info=True)
            raise

    @staticmethod
    def get_question_by_id(db: Session, question_id: str):
        """جلب سؤال بواسطة ID"""
        from app.models.requests.peer_question import PeerQuestion
        
        try:
            statement = select(PeerQuestion).where(PeerQuestion.id == question_id)
            question = db.exec(statement).first()
            return question
        except Exception as e:
            logger.error(f"❌ فشل في جلب السؤال {question_id}: {str(e)}")
            return None

    @staticmethod
    def get_questions(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        category: Optional[str] = None,
        status: Optional[str] = None,
        search_query: Optional[str] = None,
        sort_by: str = "newest",
        has_accepted_answer: Optional[bool] = None,
        is_urgent: Optional[bool] = None,
        is_featured: Optional[bool] = None,
        author_id: Optional[str] = None
    ):
        """جلب الأسئلة مع الفلاتر"""
        from app.models.requests.peer_question import PeerQuestion
        
        try:
            # بناء الاستعلام الأساسي
            query = select(PeerQuestion)
            
            # تطبيق الفلاتر
            filters = []
            
            if category and category != "all":
                filters.append(PeerQuestion.category == category)
            
            if status:
                filters.append(PeerQuestion.status == status)
            
            if has_accepted_answer is not None:
                if has_accepted_answer:
                    filters.append(PeerQuestion.accepted_answer_id.isnot(None))
                else:
                    filters.append(PeerQuestion.accepted_answer_id.is_(None))
            
            if is_urgent is not None:
                filters.append(PeerQuestion.is_urgent == is_urgent)
            
            if is_featured is not None:
                filters.append(PeerQuestion.is_featured == is_featured)
            
            if author_id:
                filters.append(PeerQuestion.author_id == author_id)
            
            # تطبيق البحث
            if search_query:
                search_terms = search_query.split()
                search_conditions = []
                for term in search_terms:
                    if len(term) > 2:
                        search_conditions.extend([
                            PeerQuestion.title.ilike(f"%{term}%"),
                            PeerQuestion.content.ilike(f"%{term}%")
                        ])
                if search_conditions:
                    filters.append(or_(*search_conditions))
            
            if filters:
                query = query.where(and_(*filters))
            
            # التصنيف
            if sort_by == "popular":
                query = query.order_by(desc(PeerQuestion.engagement_score))
            elif sort_by == "trending":
                recent_cutoff = datetime.utcnow() - timedelta(hours=24)
                query = query.where(PeerQuestion.last_activity_at >= recent_cutoff)
                query = query.order_by(desc(PeerQuestion.engagement_score))
            elif sort_by == "unanswered":
                query = query.where(PeerQuestion.answers_count == 0)
                query = query.order_by(desc(PeerQuestion.created_at))
            else:  # newest
                query = query.order_by(desc(PeerQuestion.created_at))
            
            # جلب العدد الإجمالي
            total_query = select(func.count()).select_from(query.subquery())
            total = db.exec(total_query).one()
            
            # جلب البيانات
            questions = db.exec(query.offset(skip).limit(limit)).all()
            
            return questions, total
            
        except Exception as e:
            logger.error(f"❌ فشل في جلب الأسئلة: {str(e)}")
            return [], 0

    @staticmethod
    def create_answer(db: Session, answer_data: Dict, author_id: str, author_role: str):
        """الحل النهائي"""
        try:
            print("🔍 بداية create_answer")
            print(f"📝 البيانات: {answer_data}")
            print(f"👤 المؤلف: {author_id}, {author_role}")
            
            from app.models.requests.peer_question import PeerQuestion
            from app.models.requests.peer_answer import PeerAnswer
            
            # تحقق من السؤال
            question = db.query(PeerQuestion).filter(PeerQuestion.id == answer_data['question_id']).first()
            if not question:
                raise ValueError("السؤال غير موجود")
            
            print("✅ السؤال موجود")
            
            # أنشئ الإجابة بشكل مباشر
            answer = PeerAnswer(
                content=answer_data['content'],
                question_id=answer_data['question_id'],
                author_id=author_id,
                author_role=author_role
            )
            
            print("✅ تم إنشاء كائن الإجابة")
            
            db.add(answer)
            db.commit()
            db.refresh(answer)
            
            print(f"✅ تم حفظ الإجابة: {answer.id}")
            
            return answer
            
        except Exception as e:
            db.rollback()
            print(f"❌ خطأ في create_answer: {str(e)}")
            print(f"🔍 نوع الخطأ: {type(e)}")
            import traceback
            print(f"📋 التفاصيل: {traceback.format_exc()}")
            raise

    @staticmethod
    def get_answers_for_question(db: Session, question_id: str, skip: int = 0, limit: int = 50):
        """جلب إجابات سؤال معين"""
        from app.models.requests.peer_answer import PeerAnswer
        
        try:
            query = (
                select(PeerAnswer)
                .where(PeerAnswer.question_id == question_id)
                .order_by(desc(PeerAnswer.is_accepted), desc(PeerAnswer.upvotes_count))
                .offset(skip)
                .limit(limit)
            )
            
            answers = db.exec(query).all()
            return answers
            
        except Exception as e:
            logger.error(f"❌ فشل في جلب إجابات السؤال {question_id}: {str(e)}")
            return []

    @staticmethod
    def follow_question(db: Session, question_id: str, user_id: str):
        """متابعة سؤال"""
        from app.models.requests.question_follow import QuestionFollow
        from app.models.requests.peer_question import PeerQuestion
        
        try:
            # التحقق من وجود المتابعة مسبقاً
            existing_follow = db.exec(
                select(QuestionFollow).where(
                    QuestionFollow.question_id == question_id,
                    QuestionFollow.user_id == user_id
                )
            ).first()
            
            if existing_follow:
                return existing_follow  # المستخدم يتابع السؤال بالفعل
            
            # إنشاء متابعة جديدة
            follow = QuestionFollow(
                question_id=question_id,
                user_id=user_id,
                created_at=datetime.utcnow()
            )
            
            db.add(follow)
            
            # تحديث عداد المتابعين
            question = db.get(PeerQuestion, question_id)
            if question:
                question.followers_count += 1
            
            db.commit()
            db.refresh(follow)
            
            logger.info(f"✅ تمت متابعة السؤال: {question_id} من قبل المستخدم: {user_id}")
            return follow
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ فشل في متابعة السؤال {question_id}: {str(e)}")
            raise

    @staticmethod
    def vote_answer(db: Session, answer_id: str, user_id: str, vote_type: str):
        """التصويت على إجابة - معدل"""
        from app.models.requests.peer_answer import PeerAnswer, AnswerVote
        
        try:
            answer = db.get(PeerAnswer, answer_id)
            if not answer:
                raise ValueError("الإجابة غير موجودة")
            
            # التحقق من التصويت السابق
            existing_vote = db.exec(
                select(AnswerVote).where(
                    AnswerVote.answer_id == answer_id,
                    AnswerVote.voter_id == user_id
                )
            ).first()
            
            if existing_vote:
                if existing_vote.vote_type == vote_type:
                    # إلغاء التصويت
                    db.delete(existing_vote)
                    if vote_type == "upvote":
                        answer.upvotes_count = max(0, answer.upvotes_count - 1)
                    elif vote_type == "downvote":
                        answer.downvotes_count = max(0, answer.downvotes_count - 1)
                    elif vote_type == "helpful":
                        answer.helpful_score = max(0, answer.helpful_score - 1)
                else:
                    # تغيير التصويت
                    if existing_vote.vote_type == "upvote":
                        answer.upvotes_count = max(0, answer.upvotes_count - 1)
                    elif existing_vote.vote_type == "downvote":
                        answer.downvotes_count = max(0, answer.downvotes_count - 1)
                    elif existing_vote.vote_type == "helpful":
                        answer.helpful_score = max(0, answer.helpful_score - 1)
                    
                    existing_vote.vote_type = vote_type
                    
                    if vote_type == "upvote":
                        answer.upvotes_count += 1
                    elif vote_type == "downvote":
                        answer.downvotes_count += 1
                    elif vote_type == "helpful":
                        answer.helpful_score += 1
            else:
                # تصويت جديد
                vote = AnswerVote(
                    answer_id=answer_id,
                    voter_id=user_id,
                    vote_type=vote_type,
                    created_at=datetime.utcnow()
                )
                db.add(vote)
                
                if vote_type == "upvote":
                    answer.upvotes_count += 1
                elif vote_type == "downvote":
                    answer.downvotes_count += 1
                elif vote_type == "helpful":
                    answer.helpful_score += 1
            
            answer.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(answer)
            
            logger.info(f"✅ تم التصويت على الإجابة: {answer_id} - {vote_type}")
            return answer
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ فشل في التصويت على الإجابة {answer_id}: {str(e)}")
            raise

    @staticmethod
    def get_question_stats(db: Session):
        """جلب إحصائيات عامة عن الأسئلة"""
        from app.models.requests.peer_question import PeerQuestion, QuestionCategory
        from app.models.requests.peer_answer import PeerAnswer
        
        try:
            # إحصائيات أساسية
            total_questions = db.exec(select(func.count(PeerQuestion.id))).one()
            total_answers = db.exec(select(func.count(PeerAnswer.id))).one()
            resolved_questions = db.exec(
                select(func.count(PeerQuestion.id)).where(PeerQuestion.status == "resolved")
            ).one()
            
            # إصلاح: جلب إحصائيات التصنيفات بشكل صحيح
            category_stats = {}
            for category in QuestionCategory:
                count = db.exec(
                    select(func.count(PeerQuestion.id)).where(PeerQuestion.category == category.value)
                ).one()
                category_stats[category.value] = count if count else 0
            
            # الأسئلة النشطة (في آخر 24 ساعة)
            active_cutoff = datetime.utcnow() - timedelta(hours=24)
            active_questions = db.exec(
                select(func.count(PeerQuestion.id)).where(PeerQuestion.last_activity_at >= active_cutoff)
            ).one()
            
            return {
                'total_questions': total_questions or 0,
                'total_answers': total_answers or 0,
                'resolved_questions': resolved_questions or 0,
                'active_questions': active_questions or 0,
                'categories': category_stats
            }
            
        except Exception as e:
            logger.error(f"❌ فشل في جلب إحصائيات الأسئلة: {str(e)}")
            # إرجاع إحصائيات افتراضية بدلاً من خطأ
            return {
                'total_questions': 0,
                'total_answers': 0,
                'resolved_questions': 0,
                'active_questions': 0,
                'categories': {cat.value: 0 for cat in QuestionCategory}
            }
        

    @staticmethod
    def get_category_stats(db: Session) -> Dict[str, int]:
        """جلب إحصائيات التصنيفات فقط"""
        from app.models.requests.peer_question import PeerQuestion, QuestionCategory
        
        try:
            category_stats = {}
            for category in QuestionCategory:
                count = db.exec(
                    select(func.count(PeerQuestion.id)).where(PeerQuestion.category == category.value)
                ).one()
                category_stats[category.value] = count if count else 0
            return category_stats
        except Exception as e:
            logger.error(f"❌ فشل في جلب إحصائيات التصنيفات: {str(e)}")
            return {cat.value: 0 for cat in QuestionCategory}