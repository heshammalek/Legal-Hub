import os
import logging
from typing import Dict, List, Optional, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self):
        self.loaded_models: Dict[str, Any] = {}
        self.models_directory = getattr(settings, 'MODELS_DIR', './ai_models')
        
    def load_model(self, country_code: str, model_name: str) -> Any:
        """تحميل نموذج لدولة معينة"""
        model_key = f"{country_code}_{model_name}"
        
        try:
            if model_key not in self.loaded_models:
                logger.info(f"جاري تحميل النموذج: {model_name} للدولة: {country_code}")
                
                # في المرحلة الأولى: استخدام نموذج دمية
                from .legal_models import LegalQAModel
                dummy_model = LegalQAModel(model_name=f"legal_model_{country_code}")
                self.loaded_models[model_key] = dummy_model
                
                logger.info(f"تم تحميل النموذج بنجاح: {model_key}")
                
            return self.loaded_models[model_key]
            
        except Exception as e:
            logger.error(f"خطأ في تحميل النموذج {model_key}: {str(e)}")
            raise
    
    def get_available_models(self, country_code: str = None) -> List[Dict]:
        """الحصول على النماذج المتاحة"""
        available_models = [
            {
                "id": "legal_model_sa",
                "name": "النموذج القانوني السعودي",
                "country_code": "SA",
                "version": "1.0",
                "accuracy": 0.85,
                "description": "نموذج مدرب على القوانين والأنظمة السعودية",
                "status": "available"
            },
            {
                "id": "legal_model_ae",
                "name": "النموذج القانوني الإماراتي", 
                "country_code": "AE",
                "version": "1.0", 
                "accuracy": 0.82,
                "description": "نموذج مدرب على القوانين الاتحادية والمحلية في الإمارات",
                "status": "available"
            },
            {
                "id": "legal_model_eg",
                "name": "النموذج القانوني المصري",
                "country_code": "EG", 
                "version": "1.0",
                "accuracy": 0.80,
                "description": "نموذج مدرب على القوانين المصرية والتشريعات",
                "status": "available"
            }
        ]
        
        if country_code:
            available_models = [model for model in available_models if model["country_code"] == country_code]
            
        return available_models
    
    def unload_model(self, country_code: str, model_name: str) -> bool:
        """تفريغ نموذج من الذاكرة"""
        model_key = f"{country_code}_{model_name}"
        if model_key in self.loaded_models:
            del self.loaded_models[model_key]
            logger.info(f"تم تفريغ النموذج: {model_key}")
            return True
        return False
    
    def get_loaded_models(self) -> List[str]:
        """الحصول على قائمة النماذج المحملة"""
        return list(self.loaded_models.keys())