# D:\legal_hub\backend\app\database\connection.py

from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.orm import sessionmaker  # ## NEW ##: استيراد sessionmaker
from typing import Generator
from ..core.config import settings

# Create engine (الكود الحالي كما هو)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=20,
    max_overflow=10,
    echo=settings.DEBUG
)

# ## NEW ##: تعريف SessionLocal الذي يحتاجه الـ Scheduler
# هذا هو "مصنع" جلسات الاتصال بقاعدة البيانات
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session)

def create_db_and_tables():
    """Create database tables"""
    from ..models import user_models, agenda_models # تأكد من استيراد كل النماذج
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    # ## IMPROVED ##: تحسين الدالة الحالية لتكون أكثر أمانًا
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()