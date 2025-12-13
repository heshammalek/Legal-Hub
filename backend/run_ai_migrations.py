# backend/run_ai_migrations.py
import asyncio
import os
from dotenv import load_dotenv
from app.ai_advisor.database.migration_runner import MigrationRunner

async def main():
    """تشغيل الـ migrations"""
    load_dotenv()
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL غير موجود في .env")
        return
    
    print("🚀 بدء تشغيل migrations المستشار الروبوت...")
    
    runner = MigrationRunner(database_url)
    
    # التحقق من الحالة أولاً
    status = await runner.check_migration_status()
    print("📊 الحالة الحالية:", status)
    
    # تشغيل الـ migrations
    await runner.run_migrations()
    
    # التحقق النهائي
    final_status = await runner.check_migration_status()
    print("🎯 الحالة النهائية:", final_status)

if __name__ == "__main__":
    asyncio.run(main())