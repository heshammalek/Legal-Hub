# scripts/analyze_auth_strategy.py
"""
سكريبت لتحليل استراتيجية المصادقة (Auth)
"""
import os
import re
from pathlib import Path

def analyze_auth():
    """تحليل نظام المصادقة"""
    print("="*60)
    print("🔐 تحليل استراتيجية Authentication")
    print("="*60)
    
    # فحص security.py
    security_file = Path("backend/app/core/security.py")
    if security_file.exists():
        print("\n📄 core/security.py:")
        with open(security_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # JWT
            has_jwt = 'jwt' in content.lower() or 'JWT' in content
            print(f"   🎫 JWT: {'✅' if has_jwt else '❌'}")
            
            # OAuth2
            has_oauth2 = 'OAuth2' in content or 'oauth2' in content
            print(f"   🔑 OAuth2: {'✅' if has_oauth2 else '❌'}")
            
            # Bcrypt/Hashing
            has_hashing = 'bcrypt' in content or 'hash' in content
            print(f"   🔒 Password Hashing: {'✅' if has_hashing else '❌'}")
            
            # Functions
            functions = re.findall(r'def\s+(\w+)\s*\(', content)
            if functions:
                print(f"   ⚙️  Functions: {', '.join(functions)}")
    
    # فحص auth endpoints
    auth_endpoint = Path("backend/app/api/v1/endpoints/auth.py")
    if auth_endpoint.exists():
        print("\n📄 api/v1/endpoints/auth.py:")
        with open(auth_endpoint, 'r', encoding='utf-8') as f:
            content = f.read()
            
            endpoints = re.findall(r'@router\.\w+\(["\']([^"\']+)["\']', content)
            if endpoints:
                print(f"   🛣️  Endpoints: {', '.join(endpoints)}")
    
    # فحص Token model
    token_model = Path("backend/app/models/token_models.py")
    if token_model.exists():
        print("\n📄 models/token_models.py:")
        with open(token_model, 'r', encoding='utf-8') as f:
            content = f.read()
            
            classes = re.findall(r'class\s+(\w+)', content)
            if classes:
                print(f"   📦 Classes: {', '.join(classes)}")

def analyze_dependencies():
    """تحليل الـ Dependencies المستخدمة"""
    print("\n" + "="*60)
    print("📦 تحليل Dependencies للـ Auth")
    print("="*60)
    
    # فحص ملفات الـ endpoints
    endpoints_path = Path("backend/app/api/v1/endpoints")
    
    common_deps = set()
    
    for py_file in endpoints_path.glob("*.py"):
        with open(py_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # البحث عن Depends
            deps = re.findall(r'Depends\(([^)]+)\)', content)
            common_deps.update(deps)
    
    if common_deps:
        print("   🔗 Dependencies المستخدمة:")
        for dep in sorted(common_deps):
            print(f"      - {dep}")

if __name__ == "__main__":
    analyze_auth()
    analyze_dependencies()
    
    print("\n" + "="*60)
    print("✅ تحليل Auth اكتمل")
    print("="*60)