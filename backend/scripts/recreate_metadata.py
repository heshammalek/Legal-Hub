import sys
from pathlib import Path

# إضافة المسار الرئيسي
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from sqlalchemy import create_engine, MetaData, inspect
from app.core.config import settings
from app.models.user_models import SQLModel

def recreate_metadata():
    """إعادة إنشاء metadata للجداول"""
    
    engine = create_engine(settings.DATABASE_URL)
    
    # 1. فحص الأعمدة الحالية
    inspector = inspect(engine)
    columns = inspector.get_columns('lawyer_profiles')
    
    print("📋 الأعمدة الموجودة في lawyer_profiles:")
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")
    
    # 2. مسح الـ metadata القديمة
    print("\n🧹 مسح metadata القديمة...")
    SQLModel.metadata.clear()
    
    # 3. إعادة تحميل الـ metadata
    print("🔄 إعادة تحميل metadata...")
    SQLModel.metadata.create_all(engine, checkfirst=True)
    
    # 4. التحقق من النتيجة
    print("\n✅ تم إعادة إنشاء metadata بنجاح!")
    print(f"📊 عدد الجداول: {len(SQLModel.metadata.tables)}")
    
    # 5. عرض أعمدة LawyerProfile من الـ model
    from app.models.user_models import LawyerProfile
    print("\n📋 الأعمدة في LawyerProfile model:")
    for col in LawyerProfile.__table__.columns:
        print(f"  - {col.name}: {col.type}")

if __name__ == "__main__":
    recreate_metadata()