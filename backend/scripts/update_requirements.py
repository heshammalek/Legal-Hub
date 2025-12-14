#!/usr/bin/env python3
"""
أداة تحديث تلقائية لملف requirements.txt
تشغيل: python update_requirements.py
"""

import subprocess
import sys
import pkg_resources
from datetime import datetime

def get_installed_packages():
    """جلب جميع الحزم المثبتة مع إصداراتها"""
    installed_packages = []
    for dist in pkg_resources.working_set:
        installed_packages.append(f"{dist.project_name}=={dist.version}")
    return sorted(installed_packages)

def create_requirements_file(packages, filename="requirements.txt"):
    """إنشاء/تحديث ملف requirements"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(f"# Generated automatically on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("# Legal Hub AI Advisor - Requirements\n")
        f.write("# ====================================\n\n")
        
        # تجميع الحزم حسب الفئة
        categories = {
            "الإطار والأساسيات": [],
            "قواعد البيانات": [],
            "الذكاء الاصطناعي": [],
            "معالجة المستندات": [],
            "النصوص العربية": [],
            "AWS والخدمات": [],
            "أدوات مساعدة": []
        }
        
        # تصنيف الحزم
        for package in packages:
            pkg_name = package.split('==')[0].lower()
            
            if any(framework in pkg_name for framework in ['fastapi', 'uvicorn', 'pydantic', 'sqlalchemy', 'alembic', 'async']):
                categories["الإطار والأساسيات"].append(package)
            elif any(db in pkg_name for db in ['psycopg', 'pgvector', 'redis', 'asyncpg']):
                categories["قواعد البيانات"].append(package)
            elif any(ai in pkg_name for ai in ['langchain', 'openai', 'anthropic', 'google', 'cohere', 'transformers', 'torch', 'sentence']):
                categories["الذكاء الاصطناعي"].append(package)
            elif any(doc in pkg_name for doc in ['pymupdf', 'pypdf', 'pdf', 'docx', 'beautifulsoup', 'tesseract']):
                categories["معالجة المستندات"].append(package)
            elif any(arabic in pkg_name for arabic in ['arabic', 'bidi']):
                categories["النصوص العربية"].append(package)
            elif any(aws in pkg_name for aws in ['boto', 'aws']):
                categories["AWS والخدمات"].append(package)
            else:
                categories["أدوات مساعدة"].append(package)
        
        # كتابة الحزم مصنفة
        for category, packages_list in categories.items():
            if packages_list:
                f.write(f"\n# === {category} ===\n")
                for pkg in sorted(packages_list):
                    f.write(f"{pkg}\n")
        
        # إضافة تعليمات
        f.write(f"\n\n# === تعليمات التثبيت ===\n")
        f.write("# pip install -r requirements.txt\n")
        f.write("# أو للبيئة الحالية: pip install --upgrade -r requirements.txt\n")
        
    print(f"✅ تم إنشاء/تحديث {filename} يحتوي على {len(packages)} حزمة")

def install_missing_packages(requirements_file="requirements.txt"):
    """تثبيت الحزم الناقصة من ملف requirements"""
    try:
        with open(requirements_file, 'r', encoding='utf-8') as f:
            required_packages = []
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '==' in line:
                    required_packages.append(line.split('==')[0])
        
        # التحقق من الحزم المثبتة
        installed_packages = [pkg.project_name for pkg in pkg_resources.working_set]
        missing_packages = [pkg for pkg in required_packages if pkg.lower() not in [ip.lower() for ip in installed_packages]]
        
        if missing_packages:
            print(f"🔍 العثور على {len(missing_packages)} حزمة ناقصة:")
            for pkg in missing_packages:
                print(f"   - {pkg}")
            
            confirm = input("\nهل تريد تثبيت الحزم الناقصة؟ (y/n): ")
            if confirm.lower() == 'y':
                for pkg in missing_packages:
                    try:
                        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])
                        print(f"✅ تم تثبيت {pkg}")
                    except subprocess.CalledProcessError:
                        print(f"❌ فشل تثبيت {pkg}")
        else:
            print("✅ جميع الحزم مثبتة بالفعل")
            
    except FileNotFoundError:
        print("❌ ملف requirements.txt غير موجود")

if __name__ == "__main__":
    print("🛠️  أداة إدارة متطلبات Legal Hub AI Advisor")
    print("=" * 50)
    
    while True:
        print("\n1 - إنشاء requirements.txt من الحزم المثبتة")
        print("2 - تثبيت الحزم الناقصة من requirements.txt")
        print("3 - الخروج")
        
        choice = input("\nاختر الخيار (1/2/3): ").strip()
        
        if choice == '1':
            packages = get_installed_packages()
            create_requirements_file(packages)
            print(f"📦 تم تحديث requirements.txt بـ {len(packages)} حزمة")
            
        elif choice == '2':
            install_missing_packages()
            
        elif choice == '3':
            print("👋 مع السلامة!")
            break
            
        else:
            print("❌ خيار غير صحيح")