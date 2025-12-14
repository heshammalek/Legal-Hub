import logging
import os
from typing import Dict, Any

logger = logging.getLogger(__name__)

class AWSManager:
    """مدير مركزي لخدمات AWS"""
    
    def __init__(self):
        self.services = {}
        self.is_initialized = False
    
    async def initialize_services(self):
        """تهيئة جميع خدمات AWS"""
        try:
            # التحقق من توفر بيانات الاعتماد
            if not self._check_aws_credentials():
                logger.warning("⚠️ بيانات اعتماد AWS غير متوفرة - تعطيل خدمات AWS")
                return False
            
            # تهيئة الخدمات
            from .s3_vector_store import S3VectorStore
            from .opensearch_client import AWSRetriever
            from .textract_processor import AWSTextractProcessor
            from .bedrock_llm import AWSBedrockLLM
            from .kinesis_client import KinesisDataStream
            
            self.services = {
                's3_store': S3VectorStore(),
                'opensearch': AWSRetriever(),
                'textract': AWSTextractProcessor(),
                'bedrock': AWSBedrockLLM(),
                'kinesis': KinesisDataStream()
            }
            
            self.is_initialized = True
            logger.info("✅ تم تهيئة جميع خدمات AWS بنجاح")
            return True
            
        except Exception as e:
            logger.error(f"❌ فشل تهيئة خدمات AWS: {e}")
            return False
    
    def _check_aws_credentials(self) -> bool:
        """التحقق من توفر بيانات اعتماد AWS"""
        required_env_vars = [
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY', 
            'AWS_REGION'
        ]
        
        for var in required_env_vars:
            if not os.getenv(var):
                logger.warning(f"⚠️ متغير البيئة {var} غير موجود")
                return False
        
        return True
    
    def get_service(self, service_name: str):
        """الحصول على خدمة AWS"""
        if not self.is_initialized:
            raise RuntimeError("خدمات AWS غير مهيأة")
        
        service = self.services.get(service_name)
        if not service:
            raise ValueError(f"الخدمة {service_name} غير موجودة")
        
        return service

# نسخة عامة للمدير
aws_manager = AWSManager()

async def initialize_aws_services():
    """دالة التهيئة العامة لخدمات AWS"""
    return await aws_manager.initialize_services()