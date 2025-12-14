# backend/app/data_acquisition/unified_scraper.py (المُحدّث كاملاً)
import asyncio
from typing import Dict, List, Any
import os
from pathlib import Path
from .file_downloader import FileDownloader
from .metadata_manager import MetadataManager
from .intelligent_classifier import IntelligentClassifier
from .quality_validator import QualityValidator

class UnifiedScraper:
    def __init__(self, llm_service=None, rag_service=None):
        self.downloader = FileDownloader()
        self.metadata_manager = MetadataManager()
        self.classifier = IntelligentClassifier(llm_service)
        self.quality_validator = QualityValidator()
        self.rag_service = rag_service
    
    async def process_legal_document(self, file_url: str, country: str = None, 
                                   category: str = None, metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """معالجة وثيقة قانونية كاملة مع تصنيف ذكي وتحقق من الجودة"""
        print(f"🚀 بدء معالجة وثيقة ذكية: {file_url}")
        
        # 1. تحميل الملف
        file_path = await self.downloader.download_file(file_url, "temp", "pending")
        
        if not file_path:
            return {"success": False, "error": "فشل التحميل"}
        
        # 2. التحقق من الجودة
        is_valid, quality_report = await self.quality_validator.validate_document(file_path)
        
        if not is_valid:
            # تنظيف الملف غير الصالح
            try:
                os.remove(file_path)
            except:
                pass
            return {
                "success": False, 
                "error": "فشل التحقق من الجودة",
                "quality_issues": quality_report["issues"]
            }
        
        # 3. التصنيف الذكي (إذا لم يتم تحديده)
        if not country or not category:
            country, category = await self.classifier.classify_document(file_path)
            print(f"🏷️ التصنيف الذكي: {country} -> {category}")
        
        # 4. نقل الملف للموقع النهائي
        final_path = await self._move_to_final_location(file_path, country, category)
        file_name = os.path.basename(final_path)
        
        # 5. إضافة الميتاداتا
        full_metadata = {
            "source_url": file_url,
            "auto_classified": not (country and category),
            "quality_score": quality_report["score"],
            "page_count": quality_report["page_count"],
            "file_size": quality_report["file_size"],
            "validation_passed": True,
            **(metadata or {})
        }
        
        metadata_added = self.metadata_manager.add_document_metadata(
            country=country,
            file_name=file_name,
            file_path=f"{category}/{file_name}",
            metadata=full_metadata
        )
        
        # 6. المعالجة التلقائية في RAG (إذا كان متوفراً)
        rag_result = None
        if self.rag_service and metadata_added:
            rag_metadata = {
                "title": Path(final_path).stem,
                "country": country,
                "category": category,
                "file_path": final_path,
                "source_url": file_url,
                "quality_score": quality_report["score"],
                **full_metadata
            }
            
            rag_result = await self.rag_service.ingest_legal_document(
                pdf_path=final_path,
                metadata=rag_metadata
            )
        
        return {
            "success": metadata_added,
            "file_path": final_path,
            "file_name": file_name,
            "country": country,
            "category": category,
            "metadata": full_metadata,
            "quality_report": quality_report,
            "rag_ingestion": rag_result
        }
    
    async def _move_to_final_location(self, temp_path: str, country: str, category: str) -> str:
        """نقل الملف للموقع النهائي"""
        file_name = os.path.basename(temp_path)
        final_dir = Path("backend/data/countries") / country / category
        final_dir.mkdir(parents=True, exist_ok=True)
        
        final_path = final_dir / file_name
        os.rename(temp_path, final_path)
        
        return str(final_path)