from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from sqlmodel import Session
from typing import Optional, List
import math
from sqlmodel import Session, select, func
from app.database.connection import get_session
from app.core.security import get_current_active_user
from app.schemas.discussion_schemas import *
from app.services.discussion_service import DiscussionService

import logging
logger = logging.getLogger(__name__)


router = APIRouter()

@router.get("/questions", response_model=QuestionListResponse)
async def get_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("newest", regex="^(newest|popular|unanswered|trending)$"),
    has_accepted_answer: Optional[bool] = None,
    is_urgent: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    db: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """جلب قائمة الأسئلة مع فلاتر متقدمة"""
    try:
        filters = {
            'category': category,
            'tags': tags,
            'status': status,
            'sort_by': sort_by,
            'has_accepted_answer': has_accepted_answer,
            'is_urgent': is_urgent,
            'is_featured': is_featured
        }
        
        questions, total, category_stats = DiscussionService.get_questions(
            db, skip, limit, filters, search, current_user.id
        )
        
        # تحويل النماذج إلى response models
        question_responses = []
        for q in questions:
            stats = QuestionStats(
                views_count=q.views_count,
                answers_count=q.answers_count,
                upvotes_count=q.upvotes_count,
                followers_count=q.followers_count,
                shares_count=q.shares_count,
                engagement_score=q.engagement_score
            )
            
            # جلب إجابات السؤال
            answers = DiscussionService.get_question_answers(db, q.id)
            answer_responses = []
            
            for answer in answers:  # ✅ هذا السطر كان مسافته خاطئة
                answer_responses.append(AnswerResponse(
                    id=answer.id,
                    content=answer.content,
                    summary=answer.summary,
                    author=UserInfo(
                        id=answer.author_id,
                        name="اسم المستخدم",
                        role=answer.author_role,
                        reputation_score=100
                    ),
                    is_accepted=answer.is_accepted,
                    is_expert_verified=False,
                    upvotes_count=answer.upvotes_count,
                    downvotes_count=answer.downvotes_count,
                    helpful_score=0,
                    clarity_rating=0.0,
                    accuracy_rating=0.0,
                    completeness_rating=0.0,
                    created_at=answer.created_at,
                    updated_at=answer.updated_at,
                    user_vote=None,
                    can_edit=(answer.author_id == current_user.id),
                    can_accept=(q.author_id == current_user.id),
                    comments=[],
                    attachments=[],
                    legal_references=[]
                ))
            
            question_responses.append(QuestionResponse(  # ✅ هذا السطر كان مسافته خاطئة
                id=q.id,
                title=q.title,
                content=q.content,
                category=q.category,
                tags=q.tags or [],
                is_anonymous=q.is_anonymous,
                is_urgent=q.is_urgent,
                author=UserInfo(
                    id=q.author_id,
                    name="اسم المستخدم",
                    role=q.author_role,
                    reputation_score=100
                ),
                status=q.status.value,
                stats=stats,
                created_at=q.created_at,
                updated_at=q.updated_at,
                last_activity_at=q.last_activity_at,
                featured_until=q.featured_until,
                answers=answer_responses,
                user_vote=None,
                is_following=False,
                can_edit=(q.author_id == current_user.id),
                can_close=(q.author_id == current_user.id)
            ))
        
        return QuestionListResponse(
            questions=question_responses,
            total_count=total,
            page=skip // limit + 1,
            total_pages=math.ceil(total / limit) if limit > 0 else 1,
            categories=category_stats
        )
        
    except Exception as e:
        logger.error(f"❌ فشل في جلب الأسئلة: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/questions", response_model=QuestionResponse)
async def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """إنشاء سؤال جديد"""
    try:
        logger.info(f"📥 استقبال طلب إنشاء سؤال من المستخدم: {current_user.id}")
        logger.info(f"📋 بيانات السؤال المستلمة: {question.dict()}")
        logger.info(f"👤 المستخدم: {current_user.id}, الدور: {current_user.role}")
        
        # تحويل Pydantic model إلى dict
        question_dict = question.dict()
        logger.info(f"🔍 نوع الـ tags: {type(question_dict.get('tags'))}, القيمة: {question_dict.get('tags')}")
        
        new_question = DiscussionService.create_question(
            db,
            question_dict,
            current_user.id,
            current_user.role
        )
        
        logger.info(f"✅ تم إنشاء السؤال بنجاح: {new_question.id}")
        
        stats = QuestionStats(
            views_count=new_question.views_count or 0,
            answers_count=new_question.answers_count or 0,
            upvotes_count=new_question.upvotes_count or 0,
            followers_count=new_question.followers_count or 0,
            shares_count=new_question.shares_count or 0,
            engagement_score=new_question.engagement_score or 0.0
        )
        
        response = QuestionResponse(
            id=new_question.id,
            title=new_question.title,
            content=new_question.content,
            category=new_question.category,
            tags=new_question.tags or [],
            is_anonymous=new_question.is_anonymous or False,
            is_urgent=new_question.is_urgent or False,
            author=UserInfo(
                id=current_user.id,
                name=getattr(current_user, 'full_name', 'مستخدم'),
                role=current_user.role,
                reputation_score=100
            ),
            status=new_question.status.value if new_question.status else "open",
            stats=stats,
            created_at=new_question.created_at,
            updated_at=new_question.updated_at,
            last_activity_at=new_question.last_activity_at or new_question.created_at,
            featured_until=new_question.featured_until,
            answers=[],
            user_vote=None,
            is_following=True,
            can_edit=True,
            can_close=True
        )
        
        logger.info(f"📤 إرسال الاستجابة: {response.id}")
        return response
        
    except HTTPException as he:
        logger.error(f"❌ خطأ في إنشاء السؤال (HTTP): {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"❌ فشل في إنشاء السؤال: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"فشل في إنشاء السؤال: {str(e)}")
    

@router.post("/answers", response_model=AnswerResponse)
async def create_answer(
    answer: AnswerCreate,
    db: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """إضافة إجابة جديدة"""
    try:
        new_answer = DiscussionService.add_answer(
            db,
            answer.dict(),
            current_user.id,
            current_user.role
        )
        
        return AnswerResponse(
            id=new_answer.id,
            content=new_answer.content,
            summary=new_answer.summary,
            author=UserInfo(
                id=current_user.id,
                name=getattr(current_user, 'full_name', 'مستخدم'),  # ✅ إصلاح هنا
                role=current_user.role,
                reputation_score=100
            ),
            is_accepted=new_answer.is_accepted,
            is_expert_verified=False,
            upvotes_count=new_answer.upvotes_count,
            downvotes_count=new_answer.downvotes_count,
            helpful_score=0,
            clarity_rating=0.0,
            accuracy_rating=0.0,
            completeness_rating=0.0,
            created_at=new_answer.created_at,
            updated_at=new_answer.updated_at,
            user_vote=None,
            can_edit=True,
            can_accept=False,
            comments=[],
            attachments=[],
            legal_references=[]
        )
    except Exception as e:
        logger.error(f"❌ خطأ في إنشاء الإجابة: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    

@router.post("/questions/{question_id}/follow")
async def follow_question(
    question_id: str,
    db: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """متابعة سؤال"""
    try:
        DiscussionService.follow_question(db, question_id, current_user.id)
        return {"message": "تمت متابعة السؤال بنجاح"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/answers/{answer_id}/vote")
async def vote_answer(
    answer_id: str,
    vote: VoteRequest,
    db: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """التصويت على إجابة"""
    try:
        updated_answer = DiscussionService.vote_answer(
            db, answer_id, current_user.id, vote.vote_type
        )
        
        if not updated_answer:
            raise HTTPException(status_code=404, detail="الإجابة غير موجودة")
        
        return {
            "upvotes_count": updated_answer.upvotes_count,
            "downvotes_count": updated_answer.downvotes_count,
            "helpful_score": updated_answer.helpful_score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=DiscussionStats)
async def get_discussion_stats(
    db: Session = Depends(get_session),
    current_user: dict = Depends(get_current_active_user)
):
    """جلب إحصائيات المناقشات"""
    try:
        stats = DiscussionService.get_discussion_stats(db)
        
        return DiscussionStats(
            total_questions=stats.get('total_questions', 0),
            total_answers=stats.get('total_answers', 0),
            total_users=0,  # سيتم حسابه
            resolved_questions=stats.get('resolved_questions', 0),
            trending_categories=stats.get('categories', {}),
            active_users=[]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    


    