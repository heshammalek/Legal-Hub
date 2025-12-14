# scripts/analyze_current_models.py
"""
سكريبت لتحليل جميع Models الموجودة في المشروع
"""
import os
import re
from pathlib import Path

def analyze_models():
    """تحليل ملفات Models"""
    models_path = Path("backend/app/models")
    
    if not models_path.exists():
        print("❌ مسار Models غير موجود")
        return
    
    print("="*60)
    print("📊 تحليل Models الموجودة")
    print("="*60)
    
    models_info = {}
    
    for py_file in models_path.rglob("*.py"):
        if py_file.name == "__init__.py":
            continue
            
        print(f"\n📄 ملف: {py_file.relative_to('backend/app')}")
        
        with open(py_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # البحث عن Classes
            classes = re.findall(r'class\s+(\w+)\s*\(', content)
            if classes:
                print(f"   📦 Classes: {', '.join(classes)}")
                models_info[py_file.stem] = classes
            
            # البحث عن Table names
            table_names = re.findall(r'__tablename__\s*=\s*["\'](\w+)["\']', content)
            if table_names:
                print(f"   🗄️  Tables: {', '.join(table_names)}")
            
            # البحث عن Foreign Keys
            foreign_keys = re.findall(r'ForeignKey\(["\'](\w+\.\w+)["\']', content)
            if foreign_keys:
                print(f"   🔗 Foreign Keys: {', '.join(foreign_keys)}")
    
    return models_info

def analyze_relationships():
    """تحليل العلاقات بين Models"""
    print("\n" + "="*60)
    print("🔗 تحليل العلاقات (Relationships)")
    print("="*60)
    
    models_path = Path("backend/app/models")
    
    for py_file in models_path.rglob("*.py"):
        if py_file.name == "__init__.py":
            continue
            
        with open(py_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # البحث عن relationship()
            relationships = re.findall(
                r'relationship\(["\'](\w+)["\'].*?back_populates=["\'](\w+)["\']', 
                content
            )
            
            if relationships:
                print(f"\n📄 {py_file.stem}:")
                for rel in relationships:
                    print(f"   → {rel[0]} (back_populates: {rel[1]})")

if __name__ == "__main__":
    models_info = analyze_models()
    analyze_relationships()
    
    print("\n" + "="*60)
    print("✅ تحليل Models اكتمل")
    print("="*60)