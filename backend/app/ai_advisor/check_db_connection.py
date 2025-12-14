import asyncio
import os
import sys
import logging

# نستخدم مكتبة asyncpg لأنها المكتبة التي من المرجح أن يستخدمها SQLAlchemy 
# مع رابط "postgresql+asyncpg"
try:
    import asyncpg
except ImportError:
    print("❌ خطأ: مكتبة 'asyncpg' غير مثبتة.")
    print("يرجى تشغيل: pip install asyncpg")
    sys.exit(1)

# إعدادات التسجيل
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("DB_Checker")

# قم بتهيئة رابط قاعدة البيانات الذي تستخدمه في test_rag_workflow.py
# يجب تعديل هذا الرابط ليتطابق مع بيانات الاعتماد الحقيقية لقاعدة بياناتك.
AI_DATABASE_URL = "postgresql+asyncpg://postgres:123456@localhost:5432/legal_ai"

# وظيفة مساعدة لاستخراج بيانات الاتصال من الرابط
def parse_db_url(url: str) -> dict:
    """يستخرج بيانات الاتصال من رابط asyncpg."""
    # الرابط يكون بالشكل: postgresql+asyncpg://user:pass@host:port/dbname
    try:
        # إزالة البادئة واستبدالها بـ postgresql:// للتحليل البسيط
        url_for_parsing = url.replace("postgresql+asyncpg://", "postgresql://")
        from urllib.parse import urlparse
        
        parsed = urlparse(url_for_parsing)
        
        return {
            'user': parsed.username,
            'password': parsed.password,
            'host': parsed.hostname,
            'port': parsed.port if parsed.port else 5432,
            'database': parsed.path.lstrip('/')
        }
    except Exception as e:
        logger.error(f"فشل تحليل رابط قاعدة البيانات: {e}")
        return {}

async def check_db_connection(db_url: str):
    """
    يحاول الاتصال بقاعدة البيانات وإرجاع حالة الاتصال.
    """
    db_params = parse_db_url(db_url)
    
    if not db_params:
        logger.error("❌ فشل التحقق: رابط قاعدة البيانات غير صالح.")
        return

    logger.info(f"⏳ محاولة الاتصال بقاعدة البيانات على: {db_params['host']}:{db_params['port']}...")
    
    try:
        conn = await asyncpg.connect(**db_params)
        await conn.close()
        logger.info("✅ نجاح الاتصال! قاعدة البيانات تعمل وتستجيب.")
    except ConnectionRefusedError:
        logger.error("❌ فشل الاتصال: تم رفض الاتصال. تأكد من أن PostgreSQL يعمل وأن المنفذ (5432) مفتوح.")
    except asyncpg.exceptions.InvalidAuthorizationSpecificationError:
        logger.error("❌ فشل الاتصال: بيانات الاعتماد غير صحيحة (اسم المستخدم أو كلمة المرور أو اسم قاعدة البيانات).")
    except Exception as e:
        logger.error(f"❌ فشل الاتصال لسبب غير متوقع: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(check_db_connection(AI_DATABASE_URL))
