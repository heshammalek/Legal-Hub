# scripts/analyze_db_connection.py
"""
سكريبت لتحليل استراتيجية الاتصال بقاعدة البيانات
"""
import os
import re
from pathlib import Path

def analyze_db_connection():
    """تحليل اتصال قاعدة البيانات"""
    print("="*60)
    print("💾 تحليل Database Connection Strategy")
    print("="*60)
    
    # فحص connection.py
    connection_file = Path("backend/app/database/connection.py")
    if connection_file.exists():
        print("\n📄 database/connection.py:")
        with open(connection_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # نوع الاتصال
            is_async = 'create_async_engine' in content or 'AsyncSession' in content
            is_sync = 'create_engine' in content and 'create_async_engine' not in content
            
            print(f"   🔄 Async: {'✅' if is_async else '❌'}")
            print(f"   🔄 Sync: {'✅' if is_sync else '❌'}")
            
            # Pool settings
            has_pool_settings = 'pool_size' in content or 'max_overflow' in content
            print(f"   🏊 Pool Settings: {'✅' if has_pool_settings else '❌'}")
            
            # Session management
            has_session_maker = 'sessionmaker' in content
            has_get_db = 'get_db' in content
            
            print(f"   📊 SessionMaker: {'✅' if has_session_maker else '❌'}")
            print(f"   🎁 get_db() function: {'✅' if has_get_db else '❌'}")
            
            # استخراج Functions
            functions = re.findall(r'(?:async\s+)?def\s+(\w+)', content)
            if functions:
                print(f"   ⚙️  Functions: {', '.join(functions)}")
    
    # فحص __init__.py في models
    models_init = Path("backend/app/models/__init__.py")
    if models_init.exists():
        print("\n📄 models/__init__.py:")
        with open(models_init, 'r', encoding='utf-8') as f:
            content = f.read()
            
            has_base = 'Base' in content or 'DeclarativeBase' in content
            print(f"   🏗️  Base Model: {'✅' if has_base else '❌'}")

def analyze_alembic():
    """تحليل Alembic (Migrations)"""
    print("\n" + "="*60)
    print("🔄 تحليل Alembic Migrations")
    print("="*60)
    
    alembic_dir = Path("backend/alembic")
    if alembic_dir.exists():
        print("   ✅ Alembic directory موجود")
        
        versions_dir = alembic_dir / "versions"
        if versions_dir.exists():
            migrations = list(versions_dir.glob("*.py"))
            print(f"   📝 عدد Migrations: {len(migrations)}")
            
            if migrations:
                print("   📋 Migrations الموجودة:")
                for migration in sorted(migrations):
                    print(f"      - {migration.name}")
    else:
        print("   ❌ Alembic غير مُعد بعد")

if __name__ == "__main__":
    analyze_db_connection()
    analyze_alembic()
    
    print("\n" + "="*60)
    print("✅ تحليل Database Connection اكتمل")
    print("="*60)