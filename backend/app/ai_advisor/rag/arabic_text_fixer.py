# backend/app/ai_advisor/rag/arabic_text_fixer.py
import fitz
import re
import logging
import os
import chardet
from typing import List, Dict, Any
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ArabicTextFix:
    original: str
    fixed: str
    confidence: float
    method: str

class ArabicTextFixer:
    """إصلاح النص العربي المشوه من PDF"""
    
    def __init__(self):
        self.arabic_patterns = {
            'المادة': ['ﺔﯿﻤﺳﺮﻟا', 'ﺔﯿﻤﺳﺮﻟا', 'ﻢﺳﺮﻟا'],
            'مادة': ['ﺓﺪﳌﺍ', 'ﺓﺪﳌﺍ'],
            'الباب': ['ﺐﺎﺒﻟﺍ', 'ﺐﺎﺒﻟﺍ'],
            'القانون': ['ﻥﻮﻧﺎﻘﻟﺍ', 'ﻥﻮﻧﺎﻗ'],
            'العمل': ['ﻞﻤﻌﻟﺍ', 'ﻞﻤﻌﻟﺍ'],
            'العامل': ['ﻞﻤﻌﻟﺍ', 'ﻞﻤﻌﻟﺍ']
        }
    
    def fix_arabic_text(self, text: str) -> ArabicTextFix:
        """إصلاح النص العربي المشوه"""
        if not text:
            return ArabicTextFix("", "", 0.0, "empty")
        
        methods_tried = []
        
        # الطريقة 1: محاولة فك تشفير Unicode
        try:
            fixed_unicode = self._fix_unicode_encoding(text)
            methods_tried.append(("unicode", fixed_unicode))
        except Exception as e:
            logger.debug(f"فشل إصلاح Unicode: {e}")
        
        # الطريقة 2: استبدال الأنماط المعروفة
        try:
            fixed_patterns = self._fix_known_patterns(text)
            methods_tried.append(("patterns", fixed_patterns))
        except Exception as e:
            logger.debug(f"فشل إصلاح الأنماط: {e}")
        
        # الطريقة 3: تصحيح الترميز
        try:
            fixed_encoding = self._fix_encoding(text)
            methods_tried.append(("encoding", fixed_encoding))
        except Exception as e:
            logger.debug(f"فشل إصلاح الترميز: {e}")
        
        # اختيار أفضل نتيجة
        best_fix = ""
        best_method = ""
        best_confidence = 0.0
        
        for method_name, fixed_text in methods_tried:
            if fixed_text:
                confidence = self._calculate_confidence(fixed_text)
                if confidence > best_confidence:
                    best_fix = fixed_text
                    best_method = method_name
                    best_confidence = confidence
        
        return ArabicTextFix(
            original=text[:200] + "..." if len(text) > 200 else text,
            fixed=best_fix,
            confidence=best_confidence,
            method=best_method
        )
    
    def _fix_unicode_encoding(self, text: str) -> str:
        """إصلاح ترميز Unicode المشوه"""
        # محاولة فك تشفير النص المشوه
        try:
            # إذا كان النص يحتوي على أحرف Unicode مشوهة، حاول إصلاحها
            fixed = text.encode('utf-8', errors='ignore').decode('utf-8')
            
            # استبدال الأحرف المشوهة الشائعة
            replacement_map = {
                'ﺮ': 'ر', 'ﺠ': 'ج', 'ﻟ': 'ل', 'ا': 'ا', 'ﺔ': 'ة', 'ﯿ': 'ي',
                'ﻤ': 'م', 'ﺳ': 'س', 'ﺮ': 'ر', 'ﻟ': 'ل', 'ا': 'ا', 'ﺔ': 'ة',
                'ﺪ': 'د', 'ﯾ': 'ي', '–': '-', 'ﺪ': 'د', 'ﻌ': 'ع', 'ﻟ': 'ل',
                'ا': 'ا', '١٨': '18', ')': ')', 'ﻊ': 'ع', 'ﺑ': 'ب', 'ﺎ': 'ا',
                'ﺗ': 'ت', '(': '(', 'ﻓ': 'ف', 'ﻰ': 'ى', '٣': '3', 'ﻮ': 'و',
                'ﯾ': 'ي', 'ﺎ': 'ا', 'ﻣ': 'م', 'ﺔ': 'ة', 'ﻨ': 'ن', 'ﺳ': 'س',
                '٢': '2', '٠': '0', '٢': '2', '٥': '5'
            }
            
            for wrong, correct in replacement_map.items():
                fixed = fixed.replace(wrong, correct)
            
            return fixed
        except Exception as e:
            logger.debug(f"فشل في إصلاح Unicode: {e}")
            return text
    
    def _fix_known_patterns(self, text: str) -> str:
        """إصلاح النص باستبدال الأنماط المعروفة"""
        fixed = text
        
        # استبدال الأنماط المشوهة للكلمات المهمة
        for correct_word, distorted_forms in self.arabic_patterns.items():
            for distorted in distorted_forms:
                fixed = fixed.replace(distorted, correct_word)
        
        return fixed
    
    def _fix_encoding(self, text: str) -> str:
        """محاولة تصحيح الترميز"""
        try:
            # كشف الترميز
            detected = chardet.detect(text.encode('utf-8'))
            encoding = detected.get('encoding', 'utf-8')
            confidence = detected.get('confidence', 0)
            
            if confidence > 0.7:
                fixed = text.encode(encoding, errors='ignore').decode('utf-8')
                return fixed
            else:
                return text
        except Exception:
            return text
    
    def _calculate_confidence(self, text: str) -> float:
        """حساب ثقة أن النص مصحح بشكل صحيح"""
        if not text:
            return 0.0
        
        # التحقق من وجود كلمات عربية صحيحة
        arabic_words = re.findall(r'[\u0600-\u06FF]{2,}', text)
        if not arabic_words:
            return 0.0
        
        # التحقق من الكلمات القانونية الشائعة
        legal_terms = ['المادة', 'مادة', 'الباب', 'الفصل', 'القانون', 'العمل', 'العامل']
        found_terms = sum(1 for term in legal_terms if term in text)
        
        # نسبة الكلمات الصحيحة
        correct_ratio = found_terms / len(legal_terms) if legal_terms else 0
        
        # نسبة الأحرف العربية
        arabic_chars = re.findall(r'[\u0600-\u06FF]', text)
        arabic_ratio = len(arabic_chars) / len(text) if text else 0
        
        return (correct_ratio * 0.7) + (arabic_ratio * 0.3)

class FixedPDFProcessor:
    """معالج PDF مع إصلاح النص العربي"""
    
    def __init__(self):
        self.fixer = ArabicTextFixer()
    
    def process_pdf_with_fixes(self, pdf_path: str) -> Dict[str, Any]:
        """معالجة PDF مع إصلاح النص العربي"""
        if not os.path.exists(pdf_path):
            return {"error": "الملف غير موجود"}
        
        try:
            doc = fitz.open(pdf_path)
            results = {
                "file_info": {
                    "path": pdf_path,
                    "pages": len(doc),
                    "producer": doc.metadata.get('producer', '')
                },
                "fixing_results": [],
                "extracted_articles": [],
                "statistics": {}
            }
            
            print(f"🔧 بدء إصلاح النص العربي من {len(doc)} صفحة...")
            
            total_fixes = 0
            successful_fixes = 0
            
            for page_num in range(min(10, len(doc))):  # أول 10 صفحات فقط للاختبار
                page = doc.load_page(page_num)
                original_text = page.get_text("text", sort=True)
                
                if not original_text or len(original_text.strip()) < 10:
                    continue
                
                print(f"\n📄 الصفحة {page_num + 1}:")
                print(f"   النص الأصلي: {original_text[:100]}...")
                
                # إصلاح النص
                fix_result = self.fixer.fix_arabic_text(original_text)
                
                results["fixing_results"].append({
                    "page": page_num + 1,
                    "original_preview": original_text[:200],
                    "fixed_preview": fix_result.fixed[:200] if fix_result.fixed else "",
                    "confidence": fix_result.confidence,
                    "method": fix_result.method
                })
                
                total_fixes += 1
                if fix_result.confidence > 0.3:  # ثقة مقبولة
                    successful_fixes += 1
                    print(f"   ✅ النص المصحح: {fix_result.fixed[:100]}...")
                    print(f"   📊 الثقة: {fix_result.confidence:.2f} - الطريقة: {fix_result.method}")
                    
                    # استخراج المواد من النص المصحح
                    articles = self._extract_articles_from_fixed_text(fix_result.fixed, page_num + 1)
                    results["extracted_articles"].extend(articles)
                else:
                    print(f"   ⚠️  فشل الإصلاح - الثقة: {fix_result.confidence:.2f}")
            
            doc.close()
            
            # الإحصائيات
            results["statistics"] = {
                "total_pages_processed": total_fixes,
                "successful_fixes": successful_fixes,
                "success_rate": successful_fixes / total_fixes if total_fixes > 0 else 0,
                "total_articles_found": len(results["extracted_articles"])
            }
            
            print(f"\n🎉 النتائج النهائية:")
            print(f"   - الصفحات المعالجة: {total_fixes}")
            print(f"   - الإصلاحات الناجحة: {successful_fixes}")
            print(f"   - نسبة النجاح: {results['statistics']['success_rate']:.2%}")
            print(f"   - المواد المستخرجة: {len(results['extracted_articles'])}")
            
            return results
            
        except Exception as e:
            return {"error": f"خطأ في المعالجة: {str(e)}"}
    
    def _extract_articles_from_fixed_text(self, text: str, page: int) -> List[Dict]:
        """استخراج المواد من النص المصحح"""
        articles = []
        
        # أنماط البحث عن المواد بعد الإصلاح
        article_patterns = [
            r'المادة\s*(\d+)[\s:\-]*(.*?)(?=المادة\s*\d+|$)',
            r'مادة\s*(\d+)[\s:\-]*(.*?)(?=مادة\s*\d+|$)',
            r'المادة\s*\((\d+)\)[\s:\-]*(.*?)(?=المادة\s*\(\d+\)|$)',
        ]
        
        for pattern in article_patterns:
            matches = re.finditer(pattern, text, re.DOTALL)
            for match in matches:
                if len(match.groups()) >= 2:
                    article_num = match.group(1)
                    content = match.group(2).strip()
                    
                    if len(content) > 10:
                        articles.append({
                            "page": page,
                            "number": article_num,
                            "content": content[:200] + "..." if len(content) > 200 else content,
                            "full_text": f"المادة {article_num}: {content}"
                        })
                        print(f"     📖 وجدت المادة {article_num}")
        
        return articles

def test_arabic_fixing():
    """اختبار إصلاح النص العربي"""
    processor = FixedPDFProcessor()
    
    pdf_path = "backend/data/laws/labor_law.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"❌ الملف غير موجود: {pdf_path}")
        return
    
    print("🔧 بدء اختبار إصلاح النص العربي...")
    results = processor.process_pdf_with_fixes(pdf_path)
    
    if "error" in results:
        print(f"❌ {results['error']}")
        return
    
    # عرض النتائج التفصيلية
    print("\n📋 النتائج التفصيلية:")
    for fix_result in results.get("fixing_results", [])[:5]:  # أول 5 نتائج فقط
        print(f"\n📄 الصفحة {fix_result['page']}:")
        print(f"   الثقة: {fix_result['confidence']:.2f}")
        print(f"   الطريقة: {fix_result['method']}")
        print(f"   النص الأصلي: {fix_result['original_preview']}")
        print(f"   النص المصحح: {fix_result['fixed_preview']}")
    
    # عرض المواد المستخرجة
    articles = results.get("extracted_articles", [])
    if articles:
        print(f"\n📖 المواد المستخرجة ({len(articles)}):")
        for i, article in enumerate(articles[:10]):  # أول 10 مواد
            print(f"   {i+1}. المادة {article['number']} (ص {article['page']}): {article['content']}")
    else:
        print("\n❌ لم يتم استخراج أي مواد")
        
        # تحليل أسباب الفشل
        print("\n🔍 تحليل أسباب الفشل:")
        print("   - قد يكون النص مشوهاً بشدة ولا يمكن إصلاحه")
        print("   - قد يكون الملف ممسوحاً ضوئياً (صورة)")
        print("   - قد يحتاج إلى OCR متخصص للعربية")
    
    return results

if __name__ == "__main__":
    test_arabic_fixing()