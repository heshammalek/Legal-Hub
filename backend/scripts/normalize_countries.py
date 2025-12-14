"""
Script لتوحيد أسماء الدول في قاعدة البيانات
يجب تشغيله مرة واحدة فقط لتطبيع البيانات الموجودة
"""

import sys
from pathlib import Path

# إضافة المسار الرئيسي للمشروع
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.database.connection import engine
from app.models.user_models import LawyerProfile

# خريطة شاملة لتوحيد أسماء الدول
COUNTRY_MAPPING = {
    # مصر
    'مصر': 'Egypt',
    'egypt': 'Egypt',
    'EGYPT': 'Egypt',
    'Egypt ': 'Egypt',
    ' Egypt': 'Egypt',
    'مصر ': 'Egypt',
    ' مصر': 'Egypt',
    
    # السعودية
    'السعودية': 'Saudi Arabia',
    'saudi arabia': 'Saudi Arabia',
    'Saudi Arabia': 'Saudi Arabia',
    'SAUDI ARABIA': 'Saudi Arabia',
    'سعودية': 'Saudi Arabia',
    'المملكة العربية السعودية': 'Saudi Arabia',
    'Saudi': 'Saudi Arabia',
    'KSA': 'Saudi Arabia',
    
    # الإمارات
    'الإمارات': 'UAE',
    'الامارات': 'UAE',
    'uae': 'UAE',
    'UAE': 'UAE',
    'الامارات العربية المتحدة': 'UAE',
    'United Arab Emirates': 'UAE',
    'Emirates': 'UAE',
    
    # الأردن
    'الأردن': 'Jordan',
    'jordan': 'Jordan',
    'Jordan': 'Jordan',
    'JORDAN': 'Jordan',
    'الاردن': 'Jordan',
    
    # لبنان
    'لبنان': 'Lebanon',
    'lebanon': 'Lebanon',
    'Lebanon': 'Lebanon',
    'LEBANON': 'Lebanon',
    
    # الكويت
    'الكويت': 'Kuwait',
    'kuwait': 'Kuwait',
    'Kuwait': 'Kuwait',
    'KUWAIT': 'Kuwait',
    
    # قطر
    'قطر': 'Qatar',
    'qatar': 'Qatar',
    'Qatar': 'Qatar',
    'QATAR': 'Qatar',
    
    # عمان
    'عمان': 'Oman',
    'oman': 'Oman',
    'Oman': 'Oman',
    'OMAN': 'Oman',
    'سلطنة عمان': 'Oman',
    
    # البحرين
    'البحرين': 'Bahrain',
    'bahrain': 'Bahrain',
    'Bahrain': 'Bahrain',
    'BAHRAIN': 'Bahrain',
    
    # العراق
    'العراق': 'Iraq',
    'iraq': 'Iraq',
    'Iraq': 'Iraq',
    'IRAQ': 'Iraq',
    
    # الجزائر
    'الجزائر': 'Algeria',
    'algeria': 'Algeria',
    'Algeria': 'Algeria',
    'ALGERIA': 'Algeria',
    
    # المغرب
    'المغرب': 'Morocco',
    'morocco': 'Morocco',
    'Morocco': 'Morocco',
    'MOROCCO': 'Morocco',
    
    # تونس
    'تونس': 'Tunisia',
    'tunisia': 'Tunisia',
    'Tunisia': 'Tunisia',
    'TUNISIA': 'Tunisia',
    
    # السودان
    'السودان': 'Sudan',
    'sudan': 'Sudan',
    'Sudan': 'Sudan',
    'SUDAN': 'Sudan',
    
    # اليمن
    'اليمن': 'Yemen',
    'yemen': 'Yemen',
    'Yemen': 'Yemen',
    'YEMEN': 'Yemen',
}

# القائمة المعيارية للدول المدعومة
STANDARD_COUNTRIES = [
    'Egypt',
    'Saudi Arabia',
    'UAE',
    'Jordan',
    'Lebanon',
    'Kuwait',
    'Qatar',
    'Oman',
    'Bahrain',
    'Iraq',
    'Algeria',
    'Morocco',
    'Tunisia',
    'Sudan',
    'Yemen'
]

def normalize_countries(dry_run: bool = True):
    """
    توحيد أسماء الدول في قاعدة البيانات
    
    Args:
        dry_run: إذا كان True، يعرض التغييرات فقط دون تطبيقها
    """
    print("=" * 70)
    print("🔄 بدء عملية توحيد أسماء الدول في قاعدة البيانات")
    print("=" * 70)
    
    if dry_run:
        print("⚠️  وضع المعاينة (Dry Run) - لن يتم تطبيق التغييرات")
    else:
        print("✅ وضع التطبيق الفعلي - سيتم تحديث قاعدة البيانات")
    
    print()
    
    with Session(engine) as session:
        # جلب جميع المحامين
        lawyers = session.exec(select(LawyerProfile)).all()
        
        if not lawyers:
            print("⚠️  لا يوجد محامون في قاعدة البيانات")
            return
        
        print(f"📊 تم العثور على {len(lawyers)} محامي في قاعدة البيانات")
        print()
        
        updates_count = 0
        errors_count = 0
        unchanged_count = 0
        
        # معالجة كل محامي
        for lawyer in lawyers:
            current_country = lawyer.country
            
            if not current_country:
                print(f"⚠️  المحامي {lawyer.id} ليس لديه دولة محددة - تخطي")
                errors_count += 1
                continue
            
            # إزالة المسافات الزائدة
            current_country = current_country.strip()
            
            # البحث عن التوحيد المناسب
            normalized_country = COUNTRY_MAPPING.get(current_country)
            
            if normalized_country is None:
                # إذا لم تكن في الخريطة، تحقق إذا كانت بالفعل معيارية
                if current_country in STANDARD_COUNTRIES:
                    print(f"✓ المحامي {lawyer.id}: '{current_country}' - بالفعل معياري")
                    unchanged_count += 1
                else:
                    print(f"❌ المحامي {lawyer.id}: '{current_country}' - غير معروف!")
                    errors_count += 1
                continue
            
            if normalized_country != current_country:
                print(f"🔄 المحامي {lawyer.id}: '{current_country}' → '{normalized_country}'")
                
                if not dry_run:
                    lawyer.country = normalized_country
                
                updates_count += 1
            else:
                unchanged_count += 1
        
        # تطبيق التغييرات إذا لم يكن dry_run
        if not dry_run and updates_count > 0:
            try:
                session.commit()
                print()
                print("=" * 70)
                print("✅ تم تطبيق التغييرات بنجاح!")
            except Exception as e:
                session.rollback()
                print()
                print("=" * 70)
                print(f"❌ فشل في تطبيق التغييرات: {e}")
                return
        
        # عرض الملخص
        print()
        print("=" * 70)
        print("📊 ملخص العملية:")
        print(f"   - إجمالي المحامين: {len(lawyers)}")
        print(f"   - تم التحديث: {updates_count}")
        print(f"   - بدون تغيير: {unchanged_count}")
        print(f"   - أخطاء/غير معروف: {errors_count}")
        print("=" * 70)
        
        if dry_run:
            print()
            print("💡 لتطبيق التغييرات فعلياً، شغّل السكربت بدون --dry-run")

def verify_data():
    """
    التحقق من البيانات بعد التوحيد
    """
    print("=" * 70)
    print("🔍 التحقق من البيانات بعد التوحيد")
    print("=" * 70)
    
    with Session(engine) as session:
        lawyers = session.exec(select(LawyerProfile)).all()
        
        # تجميع المحامين حسب الدولة
        country_counts = {}
        for lawyer in lawyers:
            country = lawyer.country or "غير محدد"
            country_counts[country] = country_counts.get(country, 0) + 1
        
        print()
        print("📊 توزيع المحامين حسب الدول:")
        for country, count in sorted(country_counts.items()):
            standard_mark = "✓" if country in STANDARD_COUNTRIES else "❌"
            print(f"   {standard_mark} {country}: {count} محامي")
        
        print()
        
        # التحقق من وجود دول غير معيارية
        non_standard = [c for c in country_counts.keys() 
                       if c not in STANDARD_COUNTRIES and c != "غير محدد"]
        
        if non_standard:
            print("⚠️  تحذير: توجد دول غير معيارية:")
            for country in non_standard:
                print(f"   - {country}")
        else:
            print("✅ جميع الدول معيارية!")
        
        print("=" * 70)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description='توحيد أسماء الدول في قاعدة البيانات'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='معاينة التغييرات فقط دون تطبيقها'
    )
    parser.add_argument(
        '--verify',
        action='store_true',
        help='التحقق من البيانات فقط'
    )
    
    args = parser.parse_args()
    
    if args.verify:
        verify_data()
    else:
        normalize_countries(dry_run=args.dry_run)
        
        # إذا تم التطبيق الفعلي، قم بالتحقق بعدها
        if not args.dry_run:
            print()
            verify_data()