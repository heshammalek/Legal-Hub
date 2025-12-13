# test_marker_only.py  ← غير الإسم
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_marker():
    print("🧪 اختبار Marker فقط...")
    
    try:
        from marker.converters.pdf import PdfConverter
        from marker.models import create_model_dict
        
        print("✅ جاري تحميل Marker...")
        converter = PdfConverter(artifact_dict=create_model_dict())
        
        print("✅ جاري معالجة PDF...")
        rendered = converter("data/countries/egypt/04_laws/labor_law.pdf")
        
        print(f"✅ تمت المعالجة!")
        print(f"📄 طول النص: {len(rendered.markdown)} حرف")
        print(f"📊 عدد الصفحات: {len(rendered.metadata.get('page_stats', []))}")
        
        # عرض عينة من النص
        if rendered.markdown:
            print(f"📝 العينة: {rendered.markdown[:300]}...")
        
    except Exception as e:
        print(f"❌ خطأ: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_marker()