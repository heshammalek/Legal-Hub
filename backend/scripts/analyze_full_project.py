#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سكريبت شامل لتحليل المشروع بالكامل - يشتغل من أي مكان
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Set

def find_project_root() -> Path:
    """البحث عن جذر المشروع"""
    current = Path.cwd()
    
    # إذا كنا في scripts، نرجع للـ backend
    if current.name == "scripts":
        return current.parent
    
    # إذا كنا في backend
    if current.name == "backend":
        return current
    
    # إذا كنا في الجذر
    if (current / "backend").exists():
        return current / "backend"
    
    return current

def print_section(title: str):
    """طباعة عنوان قسم"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

# ============================================================================
# 1. تحليل Models
# ============================================================================
def analyze_models(backend_path: Path):
    """تحليل Models"""
    print_section("📊 1. DATABASE MODELS")
    
    models_path = backend_path / "app" / "models"
    
    if not models_path.exists():
        print(f"   ❌ مسار Models غير موجود: {models_path}")
        return
    
    print(f"   ✅ Models Path: {models_path}\n")
    
    models_info = {}
    
    for py_file in models_path.rglob("*.py"):
        if py_file.name == "__init__.py":
            continue
        
        print(f"   📄 {py_file.name}")
        
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # البحث عن Classes
                classes = re.findall(r'class\s+(\w+)\s*\(', content)
                if classes:
                    print(f"      📦 Classes: {', '.join(classes)}")
                
                # البحث عن Table names
                table_names = re.findall(r'__tablename__\s*=\s*["\'](\w+)["\']', content)
                if table_names:
                    print(f"      🗄️  Tables: {', '.join(table_names)}")
                
                # البحث عن Foreign Keys
                foreign_keys = re.findall(r'ForeignKey\(["\']([^"\']+)["\']', content)
                if foreign_keys:
                    print(f"      🔗 Foreign Keys: {', '.join(foreign_keys)}")
                
                models_info[py_file.stem] = {
                    'classes': classes,
                    'tables': table_names,
                    'foreign_keys': foreign_keys
                }
        except Exception as e:
            print(f"      ❌ خطأ في القراءة: {e}")
        
        print()
    
    return models_info

# ============================================================================
# 2. تحليل CRUD
# ============================================================================
def analyze_crud(backend_path: Path):
    """تحليل CRUD Operations"""
    print_section("📊 2. CRUD OPERATIONS")
    
    database_path = backend_path / "app" / "database"
    
    if not database_path.exists():
        print(f"   ❌ مسار database غير موجود: {database_path}")
        return
    
    print(f"   ✅ Database Path: {database_path}\n")
    
    for py_file in database_path.glob("*crud*.py"):
        print(f"   📄 {py_file.name}")
        
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # البحث عن Functions
                functions = re.findall(r'(?:async\s+)?def\s+(\w+)\s*\(', content)
                if functions:
                    print(f"      ⚙️  Functions ({len(functions)}):")
                    for func in functions[:10]:  # أول 10 فقط
                        print(f"         - {func}()")
                    if len(functions) > 10:
                        print(f"         ... و {len(functions) - 10} أخرى")
                
                # فحص Async
                has_async = 'async def' in content and 'await' in content
                has_session = 'Session' in content or 'session' in content
                
                print(f"      🔄 Async: {'✅' if has_async else '❌'}")
                print(f"      💾 Uses Session: {'✅' if has_session else '❌'}")
        except Exception as e:
            print(f"      ❌ خطأ: {e}")
        
        print()

# ============================================================================
# 3. تحليل API Endpoints
# ============================================================================
def analyze_endpoints(backend_path: Path):
    """تحليل API Endpoints"""
    print_section("📊 3. API ENDPOINTS")
    
    endpoints_path = backend_path / "app" / "api" / "v1" / "endpoints"
    
    if not endpoints_path.exists():
        print(f"   ❌ مسار endpoints غير موجود: {endpoints_path}")
        return
    
    print(f"   ✅ Endpoints Path: {endpoints_path}\n")
    
    all_endpoints = []
    
    for py_file in endpoints_path.glob("*.py"):
        if py_file.name == "__init__.py":
            continue
        
        print(f"   📄 {py_file.name}")
        
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # فحص Router
                has_router = 'APIRouter' in content
                print(f"      🛣️  Has Router: {'✅' if has_router else '❌'}")
                
                # البحث عن Endpoints
                get_eps = re.findall(r'@router\.get\(["\']([^"\']+)["\']', content)
                post_eps = re.findall(r'@router\.post\(["\']([^"\']+)["\']', content)
                put_eps = re.findall(r'@router\.put\(["\']([^"\']+)["\']', content)
                delete_eps = re.findall(r'@router\.delete\(["\']([^"\']+)["\']', content)
                
                if get_eps:
                    print(f"      🟢 GET ({len(get_eps)}): {', '.join(get_eps[:3])}")
                    all_endpoints.extend([('GET', ep) for ep in get_eps])
                
                if post_eps:
                    print(f"      🟡 POST ({len(post_eps)}): {', '.join(post_eps[:3])}")
                    all_endpoints.extend([('POST', ep) for ep in post_eps])
                
                if put_eps:
                    print(f"      🔵 PUT ({len(put_eps)}): {', '.join(put_eps[:3])}")
                    all_endpoints.extend([('PUT', ep) for ep in put_eps])
                
                if delete_eps:
                    print(f"      🔴 DELETE ({len(delete_eps)}): {', '.join(delete_eps[:3])}")
                    all_endpoints.extend([('DELETE', ep) for ep in delete_eps])
        
        except Exception as e:
            print(f"      ❌ خطأ: {e}")
        
        print()
    
    print(f"\n   📊 إجمالي Endpoints: {len(all_endpoints)}")

# ============================================================================
# 4. تحليل Schemas
# ============================================================================
def analyze_schemas(backend_path: Path):
    """تحليل Pydantic Schemas"""
    print_section("📊 4. PYDANTIC SCHEMAS")
    
    schemas_path = backend_path / "app" / "schemas"
    
    if not schemas_path.exists():
        print(f"   ❌ مسار schemas غير موجود: {schemas_path}")
        return
    
    print(f"   ✅ Schemas Path: {schemas_path}\n")
    
    for py_file in schemas_path.glob("*.py"):
        if py_file.name == "__init__.py":
            continue
        
        print(f"   📄 {py_file.name}")
        
        try:
            with open(py_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # البحث عن Schemas
                schemas = re.findall(r'class\s+(\w+)\s*\([^)]*BaseModel[^)]*\)', content)
                if schemas:
                    print(f"      📦 Schemas ({len(schemas)}): {', '.join(schemas[:5])}")
                    if len(schemas) > 5:
                        print(f"         ... و {len(schemas) - 5} أخرى")
                
                # فحص ORM mode
                has_orm = 'from_attributes' in content or 'orm_mode' in content
                print(f"      🔧 ORM Mode: {'✅' if has_orm else '❌'}")
        
        except Exception as e:
            print(f"      ❌ خطأ: {e}")
        
        print()

# ============================================================================
# 5. تحليل Authentication
# ============================================================================
def analyze_auth(backend_path: Path):
    """تحليل استراتيجية Auth"""
    print_section("📊 5. AUTHENTICATION STRATEGY")
    
    # فحص security.py
    security_file = backend_path / "app" / "core" / "security.py"
    if security_file.exists():
        print(f"   ✅ core/security.py موجود\n")
        
        try:
            with open(security_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
                has_jwt = 'jwt' in content.lower()
                has_oauth2 = 'OAuth2' in content
                has_hashing = 'bcrypt' in content or 'hash' in content
                
                print(f"      🎫 JWT: {'✅' if has_jwt else '❌'}")
                print(f"      🔑 OAuth2: {'✅' if has_oauth2 else '❌'}")
                print(f"      🔒 Password Hashing: {'✅' if has_hashing else '❌'}")
                
                functions = re.findall(r'def\s+(\w+)\s*\(', content)
                if functions:
                    print(f"      ⚙️  Functions: {', '.join(functions[:5])}")
        except Exception as e:
            print(f"      ❌ خطأ: {e}")
    else:
        print(f"   ❌ security.py غير موجود")
    
    print()
    
    # فحص auth endpoint
    auth_file = backend_path / "app" / "api" / "v1" / "endpoints" / "auth.py"
    if auth_file.exists():
        print(f"   ✅ endpoints/auth.py موجود")
        
        try:
            with open(auth_file, 'r', encoding='utf-8') as f:
                content = f.read()
                endpoints = re.findall(r'@router\.\w+\(["\']([^"\']+)["\']', content)
                if endpoints:
                    print(f"      🛣️  Auth Endpoints: {', '.join(endpoints)}")
        except Exception as e:
            print(f"      ❌ خطأ: {e}")
    else:
        print(f"   ❌ auth.py غير موجود")

# ============================================================================
# 6. تحليل Database Connection
# ============================================================================
def analyze_database(backend_path: Path):
    """تحليل Database Connection"""
    print_section("📊 6. DATABASE CONNECTION")
    
    connection_file = backend_path / "app" / "database" / "connection.py"
    if connection_file.exists():
        print(f"   ✅ database/connection.py موجود\n")
        
        try:
            with open(connection_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
                is_async = 'create_async_engine' in content or 'AsyncSession' in content
                has_pool = 'pool_size' in content or 'max_overflow' in content
                has_sessionmaker = 'sessionmaker' in content
                has_get_db = 'get_db' in content
                
                print(f"      🔄 Async Engine: {'✅' if is_async else '❌'}")
                print(f"      🏊 Connection Pool: {'✅' if has_pool else '❌'}")
                print(f"      📊 SessionMaker: {'✅' if has_sessionmaker else '❌'}")
                print(f"      🎁 get_db() function: {'✅' if has_get_db else '❌'}")
                
                functions = re.findall(r'(?:async\s+)?def\s+(\w+)', content)
                if functions:
                    print(f"      ⚙️  Functions: {', '.join(functions)}")
        except Exception as e:
            print(f"      ❌ خطأ: {e}")
    else:
        print(f"   ❌ connection.py غير موجود")

# ============================================================================
# Main Function
# ============================================================================
def main():
    """الدالة الرئيسية"""
    print("\n" + "="*70)
    print("  🚀 LEGAL PLATFORM - COMPREHENSIVE ANALYSIS")
    print("="*70)
    
    backend_path = find_project_root()
    print(f"\n📍 Backend Path: {backend_path.absolute()}")
    
    # تنفيذ التحليلات
    analyze_models(backend_path)
    analyze_crud(backend_path)
    analyze_endpoints(backend_path)
    analyze_schemas(backend_path)
    analyze_auth(backend_path)
    analyze_database(backend_path)
    
    print_section("✅ التحليل الشامل اكتمل بنجاح")
    print()

if __name__ == "__main__":
    main()
    