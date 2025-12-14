# backend/app/data_acquisition/api/endpoints.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any
import os

router = APIRouter(prefix="/data-acquisition", tags=["data-acquisition"])

class DownloadRequest(BaseModel):
    url: str
    country: str
    category: str
    metadata: Dict[str, Any] = {}

class BatchDownloadRequest(BaseModel):
    downloads: List[DownloadRequest]

@router.get("/countries")
async def get_available_countries():
    """الحصول على قائمة الدول المتاحة"""
    # نرجع قائمة ثابتة زي ما عملنا في categories
    countries = [
        "egypt", "saudi_arabia", "uae", "jordan", "lebanon", "syria", "iraq",
        "qatar", "kuwait", "bahrain", "oman", "yemen", "palestine", "libya",
        "tunisia", "algeria", "morocco", "mauritania", "sudan", "somalia",
        "djibouti", "comoros"
    ]
    
    return {"countries": sorted(countries)}

@router.get("/categories")
async def get_available_categories():
    """الحصول على قائمة التصنيفات المتاحة"""
    categories = [
        "01_constitutions",
        "02_decisions", 
        "03_reports",
        "04_laws",
        "05_judgments",
        "06_international_agreements",
        "07_legal_templates"
    ]
    
    return {"categories": categories}

@router.post("/download")
async def download_file(request: DownloadRequest, background_tasks: BackgroundTasks):
    """تحميل ملف فردي"""
    try:
        from ..unified_scraper import UnifiedScraper
        
        scraper = UnifiedScraper()
        
        background_tasks.add_task(
            scraper.process_legal_document,
            request.url,
            request.country,
            request.category,
            request.metadata
        )
        
        return {
            "message": "بدأ تحميل الملف",
            "url": request.url,
            "country": request.country,
            "category": request.category
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في التحميل: {str(e)}")

@router.post("/batch-download")
async def batch_download_files(request: BatchDownloadRequest, background_tasks: BackgroundTasks):
    """تحميل عدة ملفات"""
    try:
        from ..unified_scraper import UnifiedScraper
        
        scraper = UnifiedScraper()
        results = []
        
        for download in request.downloads:
            background_tasks.add_task(
                scraper.process_legal_document,
                download.url,
                download.country,
                download.category,
                download.metadata
            )
            results.append({
                "url": download.url,
                "country": download.country,
                "category": download.category,
                "status": "started"
            })
        
        return {
            "message": f"بدأ تحميل {len(request.downloads)} ملف",
            "downloads": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في التحميل: {str(e)}")