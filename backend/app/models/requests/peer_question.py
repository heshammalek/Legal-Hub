from sqlmodel import SQLModel, Field
from sqlalchemy import Column, Text, JSON
from typing import Optional, List
from datetime import datetime
from uuid import uuid4
from enum import Enum

class QuestionCategory(str, Enum):
    CIVIL_LAW = "قانون مدني"
    CRIMINAL_LAW = "قانون جنائي"
    COMMERCIAL_LAW = "قانون تجاري"
    ADMINISTRATIVE_LAW = "قانون إداري"
    CONSTITUTIONAL_LAW = "قانون دستوري"
    LABOR_LAW = "قانون عمل"
    FAMILY_LAW = "قانون أسرة"
    INTERNATIONAL_LAW = "قانون دولي"
    PROCEDURAL_LAW = "قانون إجراءات"
    TAX_LAW = "قانون ضريبي"
    INTELLECTUAL_PROPERTY = "ملكية فكرية"
    OTHER = "أخرى"

class QuestionStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    RESOLVED = "resolved"
    LOCKED = "locked"

class PeerQuestion(SQLModel, table=True):
    __tablename__ = "peer_questions"
    
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, index=True)
    title: str = Field(min_length=10, max_length=200, index=True)
    content: str = Field(sa_column=Column(Text, nullable=False))
    category: QuestionCategory = Field(default=QuestionCategory.OTHER, index=True)
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    
    # معلومات الناشر
    author_id: str = Field(foreign_key="users.id", index=True)
    author_role: str = Field(index=True)
    is_anonymous: bool = Field(default=False)
    
    # الإحصائيات
    views_count: int = Field(default=0)
    answers_count: int = Field(default=0)
    upvotes_count: int = Field(default=0)
    followers_count: int = Field(default=0)
    shares_count: int = Field(default=0)
    
    # الجودة والمشاركة
    engagement_score: float = Field(default=0.0, index=True)
    # إزالة quality_score لأنه غير موجود في قاعدة البيانات
    is_featured: bool = Field(default=False)
    is_urgent: bool = Field(default=False, index=True)
    
    # الحالة
    status: QuestionStatus = Field(default=QuestionStatus.OPEN, index=True)
    accepted_answer_id: Optional[str] = Field(default=None)
    
    # التواريخ
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    closed_at: Optional[datetime] = Field(default=None)
    featured_until: Optional[datetime] = Field(default=None)