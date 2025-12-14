# app/ai_advisor/database/ai_database.py
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os

# ⚠️ تأكد أن الرابط يبدأ بـ postgresql+asyncpg://
AI_DATABASE_URL = os.getenv("AI_DATABASE_URL")

if not AI_DATABASE_URL:
    raise ValueError("❌ AI_DATABASE_URL غير موجود في environment variables")

# ✅ تأكد من أن الرابط يستخدم asyncpg
if not AI_DATABASE_URL.startswith("postgresql+asyncpg://"):
    # إصلاح الرابط تلقائياً إذا كان خاطئاً
    AI_DATABASE_URL = AI_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    AI_DATABASE_URL = AI_DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+asyncpg://")

print(f"🔗 قاعدة بيانات AI: {AI_DATABASE_URL}")

# إنشاء المحرك بـ asyncpg
ai_engine = create_async_engine(
    AI_DATABASE_URL,
    echo=True,  # ضعه False في production
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True  # للتحقق من صحة الاتصال
)

# جلسة قاعدة البيانات
AIAsyncSessionLocal = async_sessionmaker(
    bind=ai_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Base للنماذج
AIBase = declarative_base()

# Dependency للحصول على الجلسة
async def get_ai_db():
    async with AIAsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# دالة لإنشاء الجداول (للتطوير)
async def create_ai_tables():
    try:
        async with ai_engine.begin() as conn:
            await conn.run_sync(AIBase.metadata.create_all)
        print("✅ تم إنشاء جداول قاعدة بيانات الذكاء الاصطناعي بنجاح")
    except Exception as e:
        print(f"❌ خطأ في إنشاء الجداول: {e}")
        raise

# دالة للتحقق من الاتصال
async def check_ai_connection():
    try:
        async with ai_engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("✅ اتصال قاعدة بيانات الذكاء الاصطناعي يعمل بشكل صحيح")
            return True
    except Exception as e:
        print(f"❌ فشل اتصال قاعدة بيانات الذكاء الاصطناعي: {e}")
        return False

# دالة لإغلاق الاتصال
async def close_ai_connection():
    await ai_engine.dispose()
    print("✅ تم إغلاق اتصال قاعدة بيانات الذكاء الاصطناعي")