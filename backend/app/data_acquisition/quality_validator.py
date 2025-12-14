# backend/app/data_acquisition/quality_validator.py
import os
import fitz  # PyMuPDF
from pathlib import Path
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)

class QualityValidator:
    def __init__(self):
        self.min_file_size = 1024  # 1KB
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        self.min_text_length = 50  # حروف
        
    async def validate_document(self, file_path: str) -> Tuple[bool, Dict[str, Any]]:
        """التحقق من جودة المستند"""
        try:
            validation_result = {
                "is_valid": False,
                "file_path": file_path,
                "file_size": 0,
                "page_count": 0,
                "text_length": 0,
                "issues": [],
                "score": 0
            }
            
            # 1. التحقق من وجود الملف
            if not os.path.exists(file_path):
                validation_result["issues"].append("الملف غير موجود")
                return False, validation_result
            
            # 2. التحقق من حجم الملف
            file_size = os.path.getsize(file_path)
            validation_result["file_size"] = file_size
            
            if file_size < self.min_file_size:
                validation_result["issues"].append(f"حجم الملف صغير جداً: {file_size} bytes")
            elif file_size > self.max_file_size:
                validation_result["issues"].append(f"حجم الملف كبير جداً: {file_size} bytes")
            
            # 3. التحقق من محتوى PDF
            try:
                with fitz.open(file_path) as doc:
                    page_count = len(doc)
                    validation_result["page_count"] = page_count
                    
                    if page_count == 0:
                        validation_result["issues"].append("الملف لا يحتوي على صفحات")
                    
                    # استخراج النص للتحقق
                    text_content = ""
                    for page_num in range(min(5, page_count)):  # أول 5 صفحات فقط
                        text_content += doc[page_num].get_text()
                    
                    text_length = len(text_content.strip())
                    validation_result["text_length"] = text_length
                    
                    if text_length < self.min_text_length:
                        validation_result["issues"].append(f"النص قصير جداً: {text_length} حرف")
                    
                    # حساب درجة الجودة
                    score = self._calculate_quality_score(
                        file_size, page_count, text_length, len(validation_result["issues"])
                    )
                    validation_result["score"] = score
                    
            except Exception as e:
                validation_result["issues"].append(f"خطأ في قراءة PDF: {str(e)}")
            
            # تحديد إذا كان الملف صالحاً
            is_valid = len(validation_result["issues"]) == 0
            validation_result["is_valid"] = is_valid
            
            logger.info(f"🔍 تحقق من جودة {Path(file_path).name}: {is_valid} (درجة: {validation_result['score']})")
            
            return is_valid, validation_result
            
        except Exception as e:
            logger.error(f"❌ خطأ في التحقق من الجودة: {e}")
            return False, {"is_valid": False, "issues": [f"خطأ في المعالجة: {str(e)}"]}
    
    def _calculate_quality_score(self, file_size: int, page_count: int, text_length: int, issue_count: int) -> int:
        """حساب درجة جودة المستند"""
        score = 0
        
        # نقاط بناء على حجم الملف
        if file_size > 10 * 1024:  # أكبر من 10KB
            score += 25
        
        # نقاط بناء على عدد الصفحات
        if page_count >= 1:
            score += 25
        if page_count >= 5:
            score += 25
        
        # نقاط بناء على طول النص
        if text_length >= 100:
            score += 25
        elif text_length >= 500:
            score += 50
        
        # خصم بناء على المشاكل
        score -= issue_count * 20
        
        return max(0, min(100, score))