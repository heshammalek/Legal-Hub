from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from config.settings import settings

# إنشاء Base هنا بدل الاستيراد
Base = declarative_base()

# إنشاء المحرك غير المتزامن
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True  # لتصحيح الأخطاء
)

# جلسة قاعدة البيانات غير المتزامنة
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_db():
    """الحصول على جلسة قاعدة البيانات"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def create_tables():
    """إنشاء الجداول في قاعدة البيانات"""
    # نستورد النماذج هنا علشان Base يبقى معرف أولاً
    from .models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)