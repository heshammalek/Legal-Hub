from pydantic import BaseModel, validator, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class QuestionStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    RESOLVED = "resolved"

class VoteType(str, Enum):
    UPVOTE = "upvote"
    DOWNVOTE = "downvote"
    HELPFUL = "helpful"

# ============================================
# Schemas الأساسية
# ============================================

class UserInfo(BaseModel):
    id: str
    name: str
    role: str
    reputation_score: int = 0
    badge: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class QuestionStats(BaseModel):
    views_count: int = 0
    answers_count: int = 0
    upvotes_count: int = 0
    followers_count: int = 0
    shares_count: int = 0
    engagement_score: float = 0.0

    class Config:
        from_attributes = True

class Comment(BaseModel):
    id: str
    content: str
    author: UserInfo
    created_at: datetime

    class Config:
        from_attributes = True

class Answer(BaseModel):
    id: str
    content: str
    summary: Optional[str] = None
    author: UserInfo
    is_accepted: bool = False
    is_expert_verified: bool = False
    upvotes_count: int = 0
    downvotes_count: int = 0
    helpful_score: int = 0
    clarity_rating: float = 0.0
    accuracy_rating: float = 0.0
    completeness_rating: float = 0.0
    created_at: datetime
    updated_at: datetime
    user_vote: Optional[str] = None
    can_edit: bool = False
    can_accept: bool = False
    comments: List[Comment] = []
    attachments: List[str] = []
    legal_references: List[str] = []

    class Config:
        from_attributes = True

class Question(BaseModel):
    id: str
    title: str
    content: str
    category: str
    tags: List[str] = []
    author: UserInfo
    stats: QuestionStats
    status: str
    is_anonymous: bool = False
    is_urgent: bool = False
    is_featured: bool = False
    created_at: datetime
    updated_at: datetime
    last_activity_at: datetime
    accepted_answer: Optional[Answer] = None
    answers: List[Answer] = []
    is_following: bool = False
    user_vote: Optional[str] = None
    can_edit: bool = False
    can_close: bool = False
    featured_until: Optional[datetime] = None

    class Config:
        from_attributes = True

# ============================================
# Request Schemas
# ============================================

class QuestionCreate(BaseModel):
    title: str
    content: str
    category: str
    tags: List[str] = []
    is_anonymous: bool = False
    is_urgent: bool = False

    @validator('title')
    def title_length(cls, v):
        if len(v) < 10:
            raise ValueError('عنوان السؤال يجب أن يكون至少 10 أحرف')
        if len(v) > 200:
            raise ValueError('عنوان السؤال يجب ألا يتجاوز 200 حرف')
        return v

    @validator('content')
    def content_length(cls, v):
        if len(v) < 20:
            raise ValueError('محتوى السؤال يجب أن يكون至少 20 حرف')
        return v

class AnswerCreate(BaseModel):
    question_id: str
    content: str
    summary: Optional[str] = None

    @validator('content')
    def content_length(cls, v):
        if len(v) < 10:
            raise ValueError('محتوى الإجابة يجب أن يكون至少 10 أحرف')
        return v

class VoteRequest(BaseModel):
    vote_type: VoteType

# ============================================
# Response Schemas
# ============================================

class QuestionResponse(Question):
    pass

class AnswerResponse(Answer):
    pass

class QuestionListResponse(BaseModel):
    questions: List[QuestionResponse]
    total_count: int
    page: int
    total_pages: int
    categories: Dict[str, int]

    class Config:
        from_attributes = True

class DiscussionStats(BaseModel):
    total_questions: int
    total_answers: int
    total_users: int
    resolved_questions: int
    trending_categories: Dict[str, int]
    active_users: List[str] = []

    class Config:
        from_attributes = True