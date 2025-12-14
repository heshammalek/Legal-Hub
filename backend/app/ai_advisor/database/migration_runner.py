# backend/app/ai_advisor/database/migration_runner.py
import asyncpg
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class MigrationRunner:
    """منفذ migrations لقاعدة البيانات"""
    
    def __init__(self, database_url: str):
        self.database_url = database_url
        self.migrations_path = Path(__file__).parent / "../../../alembic/versions/ai_advisor"
    
    async def run_migrations(self):
        """تشغيل جميع الـ migrations"""
        try:
            conn = await asyncpg.connect(self.database_url)
            
            # تشغيل الملفات بالترتيب
            migration_files = sorted(self.migrations_path.glob("*.sql"))
            
            for migration_file in migration_files:
                logger.info(f"🏃 تشغيل migration: {migration_file.name}")
                
                with open(migration_file, 'r', encoding='utf-8') as f:
                    sql_content = f.read()
                
                try:
                    await conn.execute(sql_content)
                    logger.info(f"✅ تم: {migration_file.name}")
                except Exception as e:
                    logger.error(f"❌ فشل: {migration_file.name} - {e}")
                    raise
            
            await conn.close()
            logger.info("🎯 جميع الـ migrations تمت بنجاح")
            
        except Exception as e:
            logger.error(f"🔥 خطأ في تشغيل الـ migrations: {e}")
            raise
    
    async def check_migration_status(self):
        """التحقق من حالة الـ migrations"""
        try:
            conn = await asyncpg.connect(self.database_url)
            
            # التحقق من الجداول
            tables = await conn.fetch('''
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name LIKE 'ai_%'
            ''')
            
            # التحقق من pgvector
            extensions = await conn.fetch("SELECT * FROM pg_extension WHERE extname = 'vector'")
            
            await conn.close()
            
            status = {
                'pgvector_installed': len(extensions) > 0,
                'ai_tables': [table['table_name'] for table in tables],
                'total_tables': len(tables)
            }
            
            return status
            
        except Exception as e:
            logger.error(f"خطأ في التحقق من الحالة: {e}")
            return {'error': str(e)}