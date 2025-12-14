# scripts/analyze_crud.py
"""
سكريبت لتحليل CRUD operations الموجودة
"""
import os
import re
from pathlib import Path

def analyze_crud_files():
    """تحليل ملفات CRUD"""
    crud_path = Path("backend/app/database")
    
    if not crud_path.exists():
        print("❌ مسار database غير موجود")
        return
    
    print("="*60)
    print("📊 تحليل CRUD Operations")
    print("="*60)
    
    for py_file in crud_path.glob("*crud*.py"):
        print(f"\n📄 ملف: {py_file.name}")
        
        with open(py_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # البحث عن Functions
            functions = re.findall(r'(?:async\s+)?def\s+(\w+)\s*\(', content)
            if functions:
                print(f"   ⚙️  Functions ({len(functions)}):")
                for func in functions:
                    print(f"      - {func}()")
            
            # البحث عن استخدام Sessions
            has_session = 'Session' in content or 'session' in content
            has_async = 'async' in content and 'await' in content
            
            print(f"   🔄 Async: {'✅' if has_async else '❌'}")
            print(f"   💾 Uses Session: {'✅' if has_session else '❌'}")

if __name__ == "__main__":
    analyze_crud_files()
    
    print("\n" + "="*60)
    print("✅ تحليل CRUD اكتمل")
    print("="*60)