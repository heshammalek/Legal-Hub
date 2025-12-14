import enum
# استيراد CheckConstraint لإضافة القيود
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum, BIGINT, Index, DECIMAL, BOOLEAN, CheckConstraint
from sqlalchemy.dialects.postgresql import TIMESTAMP, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector 

# 1. إنشاء الـ Base
AIBase = declarative_base()

# تعريف قائمة الأنواع (يمكن استخدام Enum بدلاً من String + CheckConstraint)
DOCUMENT_TYPES = ('law', 'regulation', 'contract', 'case_file', 'research', 'memo', 'template')

# 2. نموذج مستندات AI (ai_legal_documents)
class AiLegalDocument(AIBase):
    __tablename__ = 'ai_legal_documents'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(500), nullable=False)
    # ✅ التصحيح 1: إزالة check_constraint من هنا ونقله إلى __table_args__ أو استخدام Enum
    # اخترنا استخدام String مع CheckConstraint للحفاظ على الشكل الأصلي، ولكن مع نقله
    document_type = Column(String(100), nullable=False)
    source_url = Column(Text, nullable=True)
    jurisdiction = Column(String(100), default='EG')
    language = Column(String(10), default='ar')
    file_path = Column(Text, nullable=True, unique=True)
    file_size = Column(BIGINT, nullable=True)
    page_count = Column(Integer, nullable=True)
    processing_status = Column(String(50), default='pending')
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # (علاقة لربط المستند بالأجزاء)
    chunks = relationship("AiDocumentChunk", back_populates="document")

    __table_args__ = (
        Index('idx_ai_doc_type', 'document_type'),
        Index('idx_ai_doc_status', 'processing_status'),
        # ✅ التصحيح 2: إضافة CheckConstraint كعنصر داخل __table_args__
        CheckConstraint(
            f"document_type IN {tuple(DOCUMENT_TYPES)}",
            name='document_type_check'
        )
    )

# 3. نموذج أجزاء المستندات (ai_document_chunks)
class AiDocumentChunk(AIBase):
    __tablename__ = 'ai_document_chunks'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey('ai_legal_documents.id', ondelete='CASCADE'), nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    embedding = Column(Vector(768), nullable=True) 
    # تم تغيير الاسم إلى data مع الإشارة للعمود باسم "metadata" لتجنب التعارض
    data = Column("metadata", JSONB, default=lambda: {}) 
    token_count = Column(Integer, nullable=True)
    section_type = Column(String(100), nullable=True)
    article_number = Column(String(50), nullable=True)
    page_number = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # (علاقات لربط الجزء بالمستند والمصادر)
    document = relationship("AiLegalDocument", back_populates="chunks")
    answer_sources = relationship("AiAnswerSource", back_populates="chunk")

    __table_args__ = (
        Index('idx_ai_chunks_document_id', 'document_id'),
        # تم تصحيح الفهرس لاستخدام الاسم الجديد للخاصية (data)
        Index('idx_ai_chunks_article', 'article_number', postgresql_where=article_number.isnot(None)),
        Index('idx_ai_chunks_metadata_gin', data, postgresql_using='gin'),
        # ❌ تم حذف الفاصلة الزائدة هنا
    )

# 4. (جديد) جدول الاستشارات (ai_legal_consultations)
class AiLegalConsultation(AIBase):
    __tablename__ = 'ai_legal_consultations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    context_used = Column(BOOLEAN, default=False)
    confidence_score = Column(DECIMAL(3,2), nullable=True)
    llm_provider = Column(String(50), nullable=True)
    tokens_used = Column(Integer, nullable=True)
    processing_time = Column(DECIMAL(8,3), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # (علاقة لربط الاستشارة بالمصادر)
    sources = relationship("AiAnswerSource", back_populates="consultation")
    
    __table_args__ = (
        Index('idx_ai_consultations_user_date', 'user_id', 'created_at'),
    )

# 5. (جديد) جدول مصادر الإجابات (ai_answer_sources)
class AiAnswerSource(AIBase):
    __tablename__ = 'ai_answer_sources'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    consultation_id = Column(Integer, ForeignKey('ai_legal_consultations.id', ondelete='CASCADE'), nullable=False)
    chunk_id = Column(Integer, ForeignKey('ai_document_chunks.id', ondelete='CASCADE'), nullable=False)
    similarity_score = Column(DECIMAL(10, 9), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # (علاقات لربط المصدر بالاستشارة والجزء)
    consultation = relationship("AiLegalConsultation", back_populates="sources")
    chunk = relationship("AiDocumentChunk", back_populates="answer_sources")