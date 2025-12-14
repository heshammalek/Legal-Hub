import logging
import pandas as pd
from typing import List, Dict, Any, Optional
import json

logger = logging.getLogger(__name__)

class LegalDataProcessor:
    def __init__(self):
        self.supported_countries = ['SA', 'AE', 'EG', 'QA', 'KW']
    
    async def prepare_training_data(self, country_code: str) -> Dict[str, Any]:
        """تحضير بيانات التدريب لدولة معينة"""
        
        try:
            logger.info(f"جاري تحضير بيانات التدريب للدولة: {country_code}")
            
            # في المرحلة الأولى: بيانات تجريبية
            training_data = await self._create_sample_data(country_code)
            
            # تنظيف البيانات
            cleaned_data = self._clean_data(training_data)
            
            # تقسيم البيانات
            train_data, val_data, test_data = self._split_data(cleaned_data)
            
            logger.info(f"تم تحضير بيانات التدريب: {len(train_data)} عينة تدريب")
            
            return {
                "train": train_data,
                "validation": val_data,
                "test": test_data,
                "country": country_code,
                "total_samples": len(cleaned_data)
            }
            
        except Exception as e:
            logger.error(f"خطأ في تحضير البيانات: {str(e)}")
            raise
    
    async def _create_sample_data(self, country_code: str) -> List[Dict[str, Any]]:
        """إنشاء بيانات تجريبية للتدريب"""
        
        sample_data = {
            'SA': [
                {
                    "question": "ما هي عقوبة السرقة في السعودية؟",
                    "answer": "عقوبة السرقة في النظام السعودي تختلف حسب قيمة المسروق وظروف الجريمة...",
                    "laws": ["نظام العقوبات"],
                    "citations": ["المادة ١ من نظام العقوبات"],
                    "category": "جنائي"
                }
            ],
            'AE': [
                {
                    "question": "ما هي مدة التقادم في الدعاوى المدنية في الإمارات؟",
                    "answer": "مدة التقادم في القانون الإماراتي تختلف حسب نوع الحق...",
                    "laws": ["القانون المدني الاتحادي"],
                    "citations": ["المادة ٢٠ من القانون المدني"],
                    "category": "مدني"
                }
            ]
        }
        
        return sample_data.get(country_code, [])
    
    def _clean_data(self, data: List[Dict]) -> List[Dict]:
        """تنظيف البيانات"""
        cleaned_data = []
        
        for item in data:
            # تنظيف النص
            cleaned_item = {
                "question": item["question"].strip(),
                "answer": item["answer"].strip(),
                "laws": [law.strip() for law in item.get("laws", [])],
                "citations": [citation.strip() for citation in item.get("citations", [])],
                "category": item.get("category", "عام")
            }
            cleaned_data.append(cleaned_item)
        
        return cleaned_data
    
    def _split_data(self, data: List[Dict], train_ratio: float = 0.7, val_ratio: float = 0.2) -> tuple:
        """تقسيم البيانات"""
        total_size = len(data)
        train_size = int(total_size * train_ratio)
        val_size = int(total_size * val_ratio)
        
        train_data = data[:train_size]
        val_data = data[train_size:train_size + val_size]
        test_data = data[train_size + val_size:]
        
        return train_data, val_data, test_data
    
    def export_data(self, data: List[Dict], file_path: str):
        """تصدير البيانات لملف"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)