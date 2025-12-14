# backend/app/ai_advisor/rag/advanced_pdf_processor.py
import os
import logging
from pathlib import Path
import requests
import json
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
import re

logger = logging.getLogger(__name__)

@dataclass
class LegalArticle:
    number: str
    content: str
    page: int
    full_text: str = ""
    section: str = ""
    tokens: int = 0

@dataclass
class ProcessingResult:
    articles: List[LegalArticle]
    sections: List[str]
    full_text: str
    total_pages: int
    stats: Dict[str, Any]
    metadata: Dict[str, Any]

class AdvancedPDFProcessor:
    """معالج PDF متعدد الخيارات - Unstructured OSS / Docling / Marker / pymupdf / OCR"""
    
    def __init__(self):
        self.processors = self._detect_available_processors()
        logger.info(f"🛠️ ترتيب المعالجات: {[p[0] for p in self.processors]}")
        
    def _detect_available_processors(self) -> List:
        """كشف المعالجات المتاحة وترتيبها حسب الأولوية"""
        processors = []
        
        # 1. Unstructured Open Source (المجاني والمستقر)
        if self._check_unstructured_oss():
            processors.append(("unstructured_oss", self._process_with_unstructured_oss))
        
        # 2. Docling (الأحدث)
        if self._check_docling():
            processors.append(("docling", self._process_with_docling))
        
        # 3. Marker (محلي جيد)
        if self._check_marker_local():
            processors.append(("marker", self._process_with_marker_local))
        
        # 4. pymupdf (بديل آمن دائماً)
        if self._check_pymupdf():
            processors.append(("pymupdf", self._process_with_pymupdf))
            
        # 5. OCR كحل أخير للمستندات الممسوحة
        if self._check_ocr_capability():
            processors.append(("ocr_fallback", self._process_with_ocr))
            
        return processors

    def _check_ocr_capability(self) -> bool:
        """التحقق من إمكانية OCR"""
        try:
            import pytesseract
            from PIL import Image
            import pdf2image
            return True
        except ImportError:
            return False

    def _process_with_ocr(self, pdf_path: str) -> ProcessingResult:
        """المعالجة باستخدام OCR للمستندات الممسوحة"""
        try:
            import pytesseract
            from PIL import Image
            import pdf2image
            
            logger.info("🔍 استخدام OCR لمعالجة مستند ممسوح...")
            
            full_text = ""
            images = pdf2image.convert_from_path(pdf_path, dpi=300)
            
            for i, image in enumerate(images):
                page_text = pytesseract.image_to_string(image, lang='ara+eng')
                full_text += f"\n--- الصفحة {i+1} ---\n{page_text}"
            
            if not full_text.strip():
                raise Exception("لم يتم استخراج أي نص باستخدام OCR")
            
            articles = self._extract_articles_enhanced(full_text)
            
            return ProcessingResult(
                articles=articles,
                sections=self._extract_sections(full_text),
                full_text=full_text,
                total_pages=len(images),
                stats={
                    "total_articles": len(articles),
                    "processing_engine": "ocr_tesseract",
                    "pages_processed": len(images)
                },
                metadata={
                    "file_size": os.path.getsize(pdf_path),
                    "ocr_used": True,
                    "dpi": 300
                }
            )
            
        except Exception as e:
            raise Exception(f"فشل OCR: {e}")

    def process_legal_document(self, file_path: str) -> ProcessingResult:
        """معالجة أي نوع من المستندات القانونية"""
        file_ext = Path(file_path).suffix.lower()
        
        # إذا كان ملف نصي، معالجته مباشرة
        if file_ext in {'.txt', '.md'}:
            return self.process_text_file(file_path)
        
        # إذا كان PDF أو صور، استخدام المعالجات المتعددة
        elif file_ext in {'.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.bmp'}:
            for processor_name, processor_func in self.processors:
                try:
                    logger.info(f"🔄 تجربة المعالجة باستخدام: {processor_name}")
                    result = processor_func(file_path)
                    
                    # التحقق من أن النتائج ليست فارغة
                    if not result.articles and result.full_text.strip():
                        logger.warning(f"⚠️ لم تستخرج {processor_name} أي مواد، جاري استخراج يدوي...")
                        result.articles = self._extract_articles_enhanced(result.full_text)
                    
                    if result.articles or len(result.full_text.strip()) > 100:
                        logger.info(f"✅ نجح المعالجة باستخدام: {processor_name} - تم استخراج {len(result.articles)} مادة")
                        return result
                    else:
                        logger.warning(f"⚠️ {processor_name} لم يستخرج محتوى كافي")
                        continue
                        
                except Exception as e:
                    logger.warning(f"⚠️ فشل {processor_name}: {e}")
                    continue
                    
            raise Exception("❌ فشل جميع معالجات المستندات المتاحة")
        
        else:
            raise Exception(f"❌ نوع الملف غير مدعوم: {file_ext}")

    def process_text_file(self, file_path: str) -> ProcessingResult:
        """معالجة الملفات النصية (.txt, .md)"""
        try:
            logger.info(f"📄 معالجة ملف نصي: {file_path}")
            
            # قراءة الملف النصي
            with open(file_path, 'r', encoding='utf-8') as file:
                full_text = file.read()
            
            if not full_text.strip():
                raise Exception("الملف النصي فارغ أو لا يمكن قراءته")
            
            # استخراج المواد
            articles = self._extract_articles_enhanced(full_text)
            
            return ProcessingResult(
                articles=articles,
                sections=self._extract_sections(full_text),
                full_text=full_text,
                total_pages=1,
                stats={
                    "total_articles": len(articles),
                    "processing_engine": "text_file",
                    "file_type": Path(file_path).suffix
                },
                metadata={
                    "file_size": os.path.getsize(file_path),
                    "encoding": "utf-8",
                    "is_text_file": True
                }
            )
            
        except Exception as e:
            raise Exception(f"فشل معالجة الملف النصي: {e}")

    # ✅ إضافة طريقة التوافق مع الكود القديم
    def process_law_pdf(self, file_path: str) -> ProcessingResult:
        """طريقة توافقية - تستدعي process_legal_document"""
        return self.process_legal_document(file_path)

    # ================== الخيار 1: Unstructured Open Source (المجاني) ==================
    def _process_with_unstructured_oss(self, pdf_path: str) -> ProcessingResult:
        """
        المعالجة باستخدام Unstructured Open Source - المستقر والمجاني
        للتثبيت: pip install "unstructured[pdf]"
        """
        try:
            from unstructured.partition.pdf import partition_pdf
            
            # استخراج العناصر من PDF
            elements = partition_pdf(
                filename=pdf_path,
                extract_images=False,
                strategy="auto",  # auto, fast, hi_res, ocr_only
                languages=["ara", "eng"],
                include_page_breaks=True
            )
            
            # تجميع النص والبيانات
            full_text = ""
            tables_data = []
            sections = []
            
            for element in elements:
                element_text = getattr(element, 'text', '')
                if element_text:
                    full_text += element_text + "\n\n"
                
                # استخراج الأقسام
                if hasattr(element, 'category') and element.category == "Title":
                    sections.append(element_text)
                
                # استخراج الجداول
                if hasattr(element, 'category') and element.category == "Table":
                    tables_data.append({
                        'text': element_text,
                        'metadata': element.metadata.to_dict() if hasattr(element, 'metadata') else {}
                    })
            
            # استخراج الصفحات
            page_numbers = set()
            for element in elements:
                if hasattr(element, 'metadata') and hasattr(element.metadata, 'page_number'):
                    page_numbers.add(element.metadata.page_number)
            
            total_pages = max(page_numbers) if page_numbers else 1
            
            # استخراج المواد
            articles = self._extract_articles_enhanced(full_text)
            
            return ProcessingResult(
                articles=articles,
                sections=sections[:10],  # أول 10 أقسام فقط
                full_text=full_text,
                total_pages=total_pages,
                stats={
                    "total_articles": len(articles),
                    "tables_extracted": len(tables_data),
                    "elements_found": len(elements),
                    "processing_engine": "unstructured_oss",
                    "strategy": "auto"
                },
                metadata={
                    "tables": tables_data,
                    "elements_categories": [e.category for e in elements if hasattr(e, 'category')],
                    "file_size": os.path.getsize(pdf_path),
                    "total_pages": total_pages
                }
            )
            
        except ImportError:
            raise Exception('unstructured غير مثبت. run: pip install "unstructured[pdf]"')
        except Exception as e:
            raise Exception(f"فشل unstructured: {e}")

    def _check_unstructured_oss(self) -> bool:
        """التحقق من توفر unstructured-open-source"""
        try:
            from unstructured.partition.pdf  import partition_pdf
            return True
        except ImportError:
            return False

    # ================== الخيار 2: Docling ==================
    def _process_with_docling(self, pdf_path: str) -> ProcessingResult:
        """المعالجة باستخدام Docling"""
        try:
            from docling.document_converter import DocumentConverter
            
            converter = DocumentConverter()
            result = converter.convert(pdf_path)
            markdown_output = result.document.export_to_markdown()
            
            articles = self._extract_articles_enhanced(markdown_output)
            
            return ProcessingResult(
                articles=articles,
                sections=self._extract_sections(markdown_output),
                full_text=markdown_output,
                total_pages=len(result.document.pages) if hasattr(result.document, 'pages') else 1,
                stats={
                    "total_articles": len(articles),
                    "processing_engine": "docling",
                    "markdown_export": True
                },
                metadata={
                    "file_size": os.path.getsize(pdf_path),
                    "converter": "docling"
                }
            )
            
        except ImportError:
            raise Exception("Docling غير مثبت. run: pip install docling")
        except Exception as e:
            raise Exception(f"فشل Docling: {e}")

    def _check_docling(self) -> bool:
        """التحقق من توفر Docling"""
        try:
            from docling.document_converter import DocumentConverter
            return True
        except ImportError:
            return False

    # ================== الخيار 3: Marker ==================
    def _process_with_marker_local(self, pdf_path: str) -> ProcessingResult:
        """المعالجة باستخدام Marker"""
        try:
            from marker.converters.pdf import PdfConverter
            from marker.models import create_model_dict
            
            converter = PdfConverter(artifact_dict=create_model_dict())
            rendered = converter(pdf_path)
            
            articles = self._extract_articles_enhanced(rendered.markdown)
            
            return ProcessingResult(
                articles=articles,
                sections=self._extract_sections(rendered.markdown),
                full_text=rendered.markdown,
                total_pages=self._count_pages(rendered.metadata),
                stats={
                    "total_articles": len(articles),
                    "processing_engine": "marker_local"
                },
                metadata=rendered.metadata
            )
            
        except ImportError:
            raise Exception("Marker غير مثبت. run: pip install marker-pdf[full]")
        except Exception as e:
            raise Exception(f"فشل Marker: {e}")

    def _check_marker_local(self) -> bool:
        """التحقق من توفر Marker"""
        try:
            from marker.converters.pdf import PdfConverter
            return True
        except ImportError:
            return False

    # ================== الخيار 4: pymupdf ==================
    def _process_with_pymupdf(self, pdf_path: str) -> ProcessingResult:
        """المعالجة باستخدام pymupdf"""
        try:
            import fitz
            doc = fitz.open(pdf_path)
            full_text = ""
            for page_num in range(len(doc)):
                page = doc[page_num]
                full_text += page.get_text() + "\n\n"
            
            articles = self._extract_articles_enhanced(full_text)
            
            return ProcessingResult(
                articles=articles,
                sections=self._extract_sections(full_text),
                full_text=full_text,
                total_pages=len(doc),
                stats={
                    "total_articles": len(articles),
                    "processing_engine": "pymupdf"
                },
                metadata={
                    "file_size": os.path.getsize(pdf_path)
                }
            )
        except ImportError:
            raise Exception("pymupdf غير مثبت. run: pip install pymupdf")

    def _check_pymupdf(self) -> bool:
        """التحقق من توفر pymupdf"""
        try:
            import fitz
            return True
        except ImportError:
            return False

    # ================== استخراج محسّن للمواد القانونية ==================
    def _extract_articles_enhanced(self, text: str) -> List[LegalArticle]:
        """استخراج مواد قانونية محسّن بشدة"""
        articles = []
        
        # تنظيف النص
        cleaned_text = self._clean_text(text)
        
        # أنماط متقدمة للمواد القانونية العربية
        patterns = [
            # النمط 1: "المادة 1: النص..."
            r'المادة\s+(\d+)[:\-\s]+\s*([^\.]+\.(?:\s+[^\.]+\.)*)(?=\s*المادة\s+\d+|\s*$|\s*مادة\s+\d+)',
            # النمط 2: "مادة 1 النص..."
            r'مادة\s+(\d+)[\s]+([^\.]+\.(?:\s+[^\.]+\.)*)(?=\s*مادة\s+\d+|\s*$|\s*المادة\s+\d+)',
            # النمط 3: "Article 1: النص..."
            r'Article\s+(\d+)[:\-\s]+\s*([^\.]+\.(?:\s+[^\.]+\.)*)(?=\s*Article\s+\d+|\s*$)',
            # النمط 4: مع نقطة نهاية واضحة
            r'المادة\s+(\d+)[\s\-\:]*([^\.]+\.[^\.]*(?:\.[^\.]*)*)(?=\s*المادة\s+\d+|\s*$)',
        ]
        
        for pattern in patterns:
            for match in re.finditer(pattern, cleaned_text, re.DOTALL | re.MULTILINE):
                article_number = match.group(1).strip()
                article_content = match.group(2).strip()
                
                # تنظيف المحتوى
                article_content = self._clean_article_content(article_content)
                
                if len(article_content) > 10:  # تأكد أن المحتوى ليس قصيراً جداً
                    articles.append(LegalArticle(
                        number=article_number,
                        content=article_content,
                        page=1,  # سيتم تحسينه لاحقاً
                        full_text=f"المادة {article_number}: {article_content}",
                        tokens=len(article_content.split())
                    ))
        
        # إذا لم نجد مواد، نحاول استخراج فقرات طويلة
        if not articles:
            articles = self._extract_fallback_articles(cleaned_text)
        
        # تسجيل النتائج
        if articles:
            logger.info(f"📄 تم استخراج {len(articles)} مادة قانونية")
            for i, article in enumerate(articles[:3]):  # أول 3 مواد فقط للتسجيل
                logger.debug(f"  المادة {article.number}: {article.content[:100]}...")
        else:
            logger.warning("⚠️ لم يتم استخراج أي مواد قانونية من النص")
            logger.debug(f"📝 عينة من النص: {cleaned_text[:500]}...")
        
        return articles

    def _extract_fallback_articles(self, text: str) -> List[LegalArticle]:
        """استخراج بديل إذا لم توجد مواد واضحة"""
        articles = []
        
        # تقسيم النص إلى فقرات طويلة
        paragraphs = re.split(r'\n\s*\n', text)
        
        for i, paragraph in enumerate(paragraphs):
            paragraph = paragraph.strip()
            if len(paragraph) > 50:  # فقرات طويلة فقط
                articles.append(LegalArticle(
                    number=str(i + 1),
                    content=paragraph,
                    page=1,
                    full_text=paragraph,
                    tokens=len(paragraph.split())
                ))
        
        return articles[:20]  # حد أقصى 20 فقرة

    def _clean_text(self, text: str) -> str:
        """تنظيف النص"""
        # إزالة مسافات زائدة
        text = re.sub(r'\s+', ' ', text)
        # التأكد من وجود مسافات بعد النقاط
        text = re.sub(r'\.([^\s])', r'. \1', text)
        return text.strip()

    def _clean_article_content(self, content: str) -> str:
        """تنظيف محتوى المادة"""
        # إزالة رموز خاصة
        content = re.sub(r'[•\-\*]', '', content)
        # إزالة مسافات زائدة
        content = re.sub(r'\s+', ' ', content)
        # قص المحتوى إذا كان طويلاً جداً
        if len(content) > 2000:
            content = content[:2000] + "..."
        return content.strip()

    def _extract_sections(self, text: str) -> List[str]:
        """استخراج الأقسام"""
        sections = []
        # أنماط العناوين
        patterns = [
            r'# (.+?)$',
            r'## (.+?)$',
            r'^(?:الفصل|الباب|القسم)\s+(.+?)$'
        ]
        
        for pattern in patterns:
            for match in re.finditer(pattern, text, re.MULTILINE):
                section = match.group(1).strip()
                if section and len(section) > 3:
                    sections.append(section)
        
        return sections[:20]  # أول 20 قسم فقط

    def _count_pages(self, metadata: Dict) -> int:
        """عد الصفحات"""
        return len(metadata.get('page_stats', [1]))