from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, JSON
from typing import Optional, List
from datetime import datetime
from uuid import uuid4
from enum import Enum

class AnswerStatus(str, Enum):
    PENDING = "pending"
    PUBLISHED = "published"
    DELETED = "deleted"
    FLAGGED = "flagged"

class PeerAnswer(SQLModel, table=True):
    __tablename__ = "peer_answers"
    
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, index=True)
    content: str = Field(sa_column=Column(Text, nullable=False))
    summary: Optional[str] = Field(max_length=500, default=None)
    
    # العلاقات
    question_id: str = Field(foreign_key="peer_questions.id", index=True)
    author_id: str = Field(foreign_key="users.id", index=True)
    author_role: str = Field(index=True)
    
    # التقييمات
    is_accepted: bool = Field(default=False, index=True)
    is_expert_verified: bool = Field(default=False)  # ✅ إضافة
    upvotes_count: int = Field(default=0)
    downvotes_count: int = Field(default=0)
    helpful_score: int = Field(default=0)  # ✅ إضافة
    clarity_rating: float = Field(default=0.0)  # ✅ إضافة
    accuracy_rating: float = Field(default=0.0)  # ✅ إضافة
    completeness_rating: float = Field(default=0.0)  # ✅ إضافة
    
    # الحالة
    status: str = Field(default="published", index=True)
    
    # التواريخ
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AnswerVote(SQLModel, table=True):
    __tablename__ = "answer_votes"
    
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    answer_id: str = Field(foreign_key="peer_answers.id", index=True)
    voter_id: str = Field(foreign_key="users.id", index=True)
    vote_type: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)