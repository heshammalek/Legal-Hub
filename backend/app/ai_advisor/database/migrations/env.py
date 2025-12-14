import asyncio
from logging.config import fileConfig
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import pool
from alembic import context

# --- 1. إعداد مسارات بايثون (هام جداً) ---
import os
import sys
from pathlib import Path

# إضافة جذر 'backend' للمسار حتى يتمكن من العثور على 'app'
current_dir = Path(__file__).resolve().parent.parent.parent
backend_dir = current_dir.parent.parent
sys.path.insert(0, str(backend_dir))

# --- 2. استيراد النماذج (Base) ---
# استيراد النماذج الجديدة التي أنشأناها
from app.ai_advisor.database.models import Base

# --- إعدادات Alembic (كما هي) ---
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name, encoding='utf-8')

# --- 3. تحديد الـ Metadata ---
# هذا يخبر Alembic ما هي الجداول التي يجب أن يبحث عنها
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.
    (لا نستخدمه عادةً مع async)
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    """المنطق الفعلي لتشغيل الـ migrations"""
    context.configure(
        connection=connection, 
        target_metadata=target_metadata,
        # (هام: تأكد من أن pgvector لا يتطلب هذا)
        # include_object=lambda obj, name, type_, reflected, compare_to: not (type_ == "index" and reflected and "ivfflat" in name)
    )
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.
    (معدل بالكامل ليدعم asyncio)
    """
    # 1. جلب الـ URL من alembic.ini (أو من migration_runner)
    url = config.get_main_option("sqlalchemy.url")
    
    # 2. إنشاء محرك Async
    connectable = create_async_engine(
        url,
        poolclass=pool.NullPool, # (لا نحتاج pool هنا)
    )

    # 3. الاتصال وتشغيل الـ migrations
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

# --- الاختيار بين Online/Offline ---
if context.is_offline_mode():
    run_migrations_offline()
else:
    # (تشغيل الدالة الـ Async)
    asyncio.run(run_migrations_online())