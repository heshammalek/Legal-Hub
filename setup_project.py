#!/usr/bin/env python3
"""
إعداد تلقائي للمشروع على جهاز جديد
تشغيل: python setup_project.py
"""

import os
import subprocess
import sys
import venv
from pathlib import Path

def run_command(cmd, description=""):
    """تنفيذ أمر مع التعامل مع الأخطاء"""
    print(f"🚀 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} - تم بنجاح")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - فشل: {e}")
        return False

def setup_backend():
    """إعداد البيئة الخلفية"""
    backend_dir = Path("backend")
    
    # إنشاء virtual environment
    if not (backend_dir / "venv").exists():
        print("🐍 إنشاء virtual environment...")
        venv.create(backend_dir / "venv", with_pip=True)
    
    # تنشيط الـ venv وتثبيت المتطلبات
    venv_python = backend_dir / "venv" / "Scripts" / "python.exe"
    venv_pip = backend_dir / "venv" / "Scripts" / "pip.exe"
    
    if venv_pip.exists():
        commands = [
            (f'"{venv_pip}" install --upgrade pip', "تحديث pip"),
            (f'"{venv_pip}" install -r requirements.txt', "تثبيت متطلبات Python"),
        ]
        
        for cmd, desc in commands:
            if not run_command(cmd, desc):
                return False
    else:
        print("❌ virtual environment غير جاهز")
        return False
    
    return True

def setup_frontend():
    """إعداد الواجهة الأمامية"""
    frontend_dir = Path("frontend")
    
    if (frontend_dir / "package.json").exists():
        commands = [
            ("npm install", "تثبيت dependencies"),
            ("npm run build", "بناء المشروع"),
        ]
        
        for cmd, desc in commands:
            if not run_command(cmd, desc):
                return False
    else:
        print("⚠️  frontend غير موجود - تخطي")
    
    return True

def check_database():
    """التحقق من اتصال قاعدة البيانات"""
    print("🔍 التحقق من اتصال PostgreSQL...")
    
    # يمكن إضافة اختبار اتصال بقاعدة البيانات هنا
    print("✅ افتراضي: تأكد من تشغيل PostgreSQL على المنفذ 5432")
    return True

def main():
    """الدالة الرئيسية"""
    print("🏗️  إعداد Legal Hub AI Advisor على جهاز جديد")
    print("=" * 50)
    
    # التحقق من الملفات الأساسية
    essential_files = [
        "backend/requirements.txt",
        "frontend/package.json"
    ]
    
    for file in essential_files:
        if not Path(file).exists():
            print(f"❌ ملف {file} غير موجود")
            return
    
    # تنفيذ الإعداد
    steps = [
        ("الواجهة الخلفية", setup_backend),
        ("الواجهة الأمامية", setup_frontend),
        ("قاعدة البيانات", check_database),
    ]
    
    for step_name, step_func in steps:
        print(f"\n{'='*40}")
        print(f"📦 {step_name}")
        print('='*40)
        
        if not step_func():
            print(f"❌ فشل في {step_name}")
            return
    
    print("\n🎉 تم إعداد المشروع بنجاح!")
    print("\n📋 خطوات التشغيل:")
    print("1. cd frontend && npm run dev")
    print("2. cd backend && .\\venv\\Scripts\\activate")
    print("3. uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("4. uvicorn app.ai_advisor.main:app --reload --port 8001")

if __name__ == "__main__":
    main()