# scripts/analyze_schemas.py
"""
سكريبت لتحليل Pydantic Schemas
"""
import os
import re
from pathlib import Path

def analyze_schemas():
    """تحليل Schemas"""
    schemas_path = Path("backend/app/schemas")
    
    if not schemas_path.exists():
        print("❌ مسار schemas غير موجود")
        return
    
    print("="*60)
    print("📊 تحليل Pydantic Schemas")
    print("="*60)
    
    for py_file in schemas_path.glob("*.py"):
        if py_file.name == "__init__.py":
            continue
            
        print(f"\n📄 ملف: {py_file.name}")
        
        with open(py_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # البحث عن BaseModel classes
            schemas = re.findall(r'class\s+(\w+)\s*\(.*?BaseModel.*?\):', content)
            if schemas:
                print(f"   📦 Schemas ({len(schemas)}):")
                for schema in schemas:
                    print(f"      - {schema}")
            
            # البحث عن ConfigDict أو Config class
            has_orm_mode = 'from_attributes' in content or 'orm_mode' in content
            print(f"   🔧 ORM Mode: {'✅' if has_orm_mode else '❌'}")

if __name__ == "__main__":
    analyze_schemas()
    
    print("\n" + "="*60)
    print("✅ تحليل Schemas اكتمل")
    print("="*60)