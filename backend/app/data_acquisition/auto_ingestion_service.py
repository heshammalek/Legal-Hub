# backend/app/data_acquisition/auto_ingestion_service.py (مُحدّث)
from typing import Dict, Any
import logging
from pathlib import Path
import asyncio

logger = logging.getLogger(__name__)

class AutoIngestionService:
    def __init__(self, rag_retriever):
        self.rag_retriever = rag_retriever
        self.watcher = None
        
    async def start_auto_ingestion(self):
        """بدء الابتلاع التلقائي"""
        from .smart_file_watcher import SmartFileWatcher
        
        self.watcher = SmartFileWatcher(rag_service=self.rag_retriever)
        await self.watcher.start_monitoring()
    
    async def process_existing_files(self):
        """معالجة الملفات الموجودة بالفعل في النظام"""
        try:
            logger.info("🔍 فحص الملفات الموجودة للمعالجة...")
            # هنا يمكن إضافة منطق لمعالجة الملفات القديمة
            await asyncio.sleep(10)  # انتظار بسيط قبل البدء
        except Exception as e:
            logger.error(f"❌ خطأ في معالجة الملفات الموجودة: {e}")