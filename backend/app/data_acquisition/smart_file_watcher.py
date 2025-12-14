# backend/app/data_acquisition/smart_file_watcher.py
import asyncio
import os
import time
from pathlib import Path
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class SmartFileWatcher:
    def __init__(self, rag_service=None):
        self.rag_service = rag_service
        self.base_path = Path("backend/data/countries")
        self.processed_files = set()
        
    async def start_monitoring(self):
        """بدء المراقبة الذكية للمجلدات"""
        logger.info("🚀 بدء مراقبة مجلدات البيانات الذكية...")
        
        while True:
            try:
                new_files = await self.scan_for_new_files()
                if new_files:
                    await self.process_new_files(new_files)
                    
                await asyncio.sleep(60)  # فحص كل دقيقة
                
            except Exception as e:
                logger.error(f"❌ خطأ في المراقبة: {e}")
                await asyncio.sleep(300)  # انتظار 5 دقائق عند الخطأ
    
    async def scan_for_new_files(self) -> Dict[str, Any]:
        """مسح ذكي للملفات الجديدة"""
        new_files = {}
        
        for country_dir in self.base_path.iterdir():
            if not country_dir.is_dir():
                continue
                
            for category_dir in country_dir.iterdir():
                if not category_dir.is_dir():
                    continue
                    
                for file_path in category_dir.glob("*.pdf"):
                    if str(file_path) not in self.processed_files:
                        country = country_dir.name
                        category = category_dir.name
                        
                        if country not in new_files:
                            new_files[country] = {}
                        if category not in new_files[country]:
                            new_files[country][category] = []
                            
                        new_files[country][category].append(str(file_path))
                        
        return new_files
    
    async def process_new_files(self, new_files: Dict[str, Any]):
        """معالجة الملفات الجديدة تلقائياً"""
        for country, categories in new_files.items():
            for category, files in categories.items():
                for file_path in files:
                    try:
                        logger.info(f"🔄 معالجة تلقائية: {file_path}")
                        
                        # إضافة الملف للنظام RAG تلقائياً
                        if self.rag_service:
                            metadata = {
                                "title": Path(file_path).stem,
                                "country": country,
                                "category": category,
                                "file_path": file_path,
                                "auto_processed": True,
                                "processed_at": time.time()
                            }
                            
                            result = await self.rag_service.ingest_legal_document(
                                pdf_path=file_path,
                                metadata=metadata
                            )
                            
                            if result.get("success"):
                                self.processed_files.add(file_path)
                                logger.info(f"✅ تمت المعالجة التلقائية: {file_path}")
                            else:
                                logger.error(f"❌ فشل المعالجة التلقائية: {file_path}")
                                
                    except Exception as e:
                        logger.error(f"❌ خطأ في المعالجة التلقائية: {e}")