from abc import ABC, abstractmethod
from typing import Any, Dict, List

class BaseAIModel(ABC):
    """الفئة الأساسية لجميع نماذج الذكاء الاصطناعي"""
    
    @abstractmethod
    def load_model(self, model_path: str) -> Any:
        """تحميل النموذج"""
        pass
    
    @abstractmethod
    def predict(self, input_data: Any) -> Dict[str, Any]:
        """إجراء التوقع"""
        pass
    
    @abstractmethod
    def preprocess(self, input_data: Any) -> Any:
        """معالجة المدخلات"""
        pass
    
    def get_model_info(self) -> Dict[str, str]:
        """الحصول على معلومات النموذج"""
        return {
            "model_type": self.__class__.__name__,
            "version": "1.0.0"
        }