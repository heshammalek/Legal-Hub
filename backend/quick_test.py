# quick_test.py - اختبار سريع للـ Backend
import requests
import json
import sys
from datetime import datetime

def test_backend_directly():
    """اختبار الـ Backend مباشرة"""
    
    # بيانات الاختبار
    test_data = {
        "fullName": "هشام مالك",
        "email": "h3malik@gmail.com",
        "phone": "01013541925", 
        "subject": "اختبار النظام",
        "message": "هذه رسالة اختبار للتأكد من عمل النظام بشكل صحيح. الرسالة طويلة بما فيه الكفاية لتجاوز الحد الأدنى المطلوب.",
        "contactMethod": "email"
    }
    
    backend_url = "http://localhost:8000/v1/pages/contact"
    
    print("🧪 بدء اختبار Backend...")
    print(f"📍 الرابط: {backend_url}")
    print(f"📤 البيانات: {json.dumps(test_data, ensure_ascii=False, indent=2)}")
    print("-" * 50)
    
    try:
        # إرسال الطلب
        response = requests.post(
            backend_url,
            json=test_data,
            headers={
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json'
            },
            timeout=30
        )
        
        print(f"📨 حالة الاستجابة: {response.status_code}")
        print(f"📋 رؤوس الاستجابة: {dict(response.headers)}")
        print("-" * 30)
        
        # طباعة النص الخام
        print("📄 النص الخام:")
        print(response.text[:500] + ("..." if len(response.text) > 500 else ""))
        print("-" * 30)
        
        # محاولة تحويل JSON
        try:
            json_response = response.json()
            print("✅ تم تحويل JSON بنجاح:")
            print(json.dumps(json_response, ensure_ascii=False, indent=2))
        except json.JSONDecodeError as e:
            print(f"❌ خطأ في تحويل JSON: {e}")
            print("النص غير صالح كـ JSON")
        
        # تحليل الحالة
        if response.status_code == 200:
            print("\n🎉 نجح الاختبار!")
        elif response.status_code == 422:
            print("\n⚠️ خطأ في البيانات (422)")
        elif response.status_code == 500:
            print("\n❌ خطأ داخلي في الخادم (500)")
            print("💡 تحقق من:")
            print("  - قاعدة البيانات")
            print("  - إعدادات البريد الإلكتروني") 
            print("  - logs الخادم")
        else:
            print(f"\n❓ حالة غير متوقعة: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ لا يمكن الاتصال بالخادم")
        print("💡 تأكد من تشغيل Backend على المنفذ 8000")
        
    except requests.exceptions.Timeout:
        print("❌ انتهت مهلة الاتصال")
        
    except Exception as e:
        print(f"❌ خطأ غير متوقع: {e}")
        print(f"نوع الخطأ: {type(e).__name__}")

def test_simple_validation():
    """اختبار بسيط للتحقق من صحة البيانات"""
    
    print("\n🔍 اختبار التحقق من صحة البيانات...")
    
    # بيانات خاطئة متعمدة
    invalid_tests = [
        {
            "name": "اسم قصير",
            "data": {"fullName": "أ", "email": "test@example.com", "phone": "01234567890", "subject": "موضوع", "message": "رسالة طويلة بما فيه الكفاية", "contactMethod": "email"}
        },
        {
            "name": "بريد خاطئ", 
            "data": {"fullName": "اسم صحيح", "email": "invalid-email", "phone": "01234567890", "subject": "موضوع", "message": "رسالة طويلة بما فيه الكفاية", "contactMethod": "email"}
        },
        {
            "name": "هاتف قصير",
            "data": {"fullName": "اسم صحيح", "email": "test@example.com", "phone": "123", "subject": "موضوع", "message": "رسالة طويلة بما فيه الكفاية", "contactMethod": "email"}
        },
        {
            "name": "رسالة قصيرة",
            "data": {"fullName": "اسم صحيح", "email": "test@example.com", "phone": "01234567890", "subject": "موضوع", "message": "قصير", "contactMethod": "email"}
        }
    ]
    
    for test in invalid_tests:
        print(f"\n📝 اختبار: {test['name']}")
        try:
            response = requests.post(
                "http://localhost:8000/v1/pages/contact",
                json=test['data'],
                timeout=10
            )
            
            if response.status_code == 422:
                print("✅ تم اكتشاف الخطأ كما هو متوقع")
            else:
                print(f"⚠️ حالة غير متوقعة: {response.status_code}")
                
        except Exception as e:
            print(f"❌ خطأ في الاختبار: {e}")

if __name__ == "__main__":
    print("🚀 بدء الاختبار الشامل...")
    print(f"⏰ الوقت: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # اختبار أساسي
    test_backend_directly()
    
    # اختبار التحقق من صحة البيانات
    test_simple_validation()
    
    print("\n" + "=" * 50)
    print("✅ انتهى الاختبار")