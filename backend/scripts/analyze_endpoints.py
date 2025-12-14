# scripts/analyze_endpoints.py
"""
سكريبت لتحليل API Endpoints الموجودة
"""
import os
import re
from pathlib import Path

def analyze_endpoints():
    """تحليل Endpoints"""
    api_path = Path("backend/app/api/v1/endpoints")
    
    if not api_path.exists():
        print("❌ مسار endpoints غير موجود")
        return
    
    print("="*60)
    print("📊 تحليل API Endpoints")
    print("="*60)
    
    all_endpoints = {}
    
    for py_file in api_path.glob("*.py"):
        if py_file.name == "__init__.py":
            continue
            
        print(f"\n📄 ملف: {py_file.name}")
        
        with open(py_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # البحث عن router
            has_router = 'APIRouter' in content
            print(f"   🛣️  Has Router: {'✅' if has_router else '❌'}")
            
            # البحث عن HTTP methods
            endpoints = []
            
            get_endpoints = re.findall(r'@router\.get\(["\']([^"\']+)["\']', content)
            post_endpoints = re.findall(r'@router\.post\(["\']([^"\']+)["\']', content)
            put_endpoints = re.findall(r'@router\.put\(["\']([^"\']+)["\']', content)
            delete_endpoints = re.findall(r'@router\.delete\(["\']([^"\']+)["\']', content)
            
            if get_endpoints:
                print(f"   🟢 GET ({len(get_endpoints)}):")
                for ep in get_endpoints:
                    print(f"      - {ep}")
                    endpoints.append(('GET', ep))
            
            if post_endpoints:
                print(f"   🟡 POST ({len(post_endpoints)}):")
                for ep in post_endpoints:
                    print(f"      - {ep}")
                    endpoints.append(('POST', ep))
            
            if put_endpoints:
                print(f"   🔵 PUT ({len(put_endpoints)}):")
                for ep in put_endpoints:
                    print(f"      - {ep}")
                    endpoints.append(('PUT', ep))
            
            if delete_endpoints:
                print(f"   🔴 DELETE ({len(delete_endpoints)}):")
                for ep in delete_endpoints:
                    print(f"      - {ep}")
                    endpoints.append(('DELETE', ep))
            
            all_endpoints[py_file.stem] = endpoints
    
    return all_endpoints

if __name__ == "__main__":
    endpoints = analyze_endpoints()
    
    print("\n" + "="*60)
    print(f"✅ إجمالي الـ Endpoints: {sum(len(eps) for eps in endpoints.values())}")
    print("="*60)