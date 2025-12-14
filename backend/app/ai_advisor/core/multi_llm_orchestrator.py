import logging
from typing import Dict, Any, Optional, AsyncGenerator
import os
import asyncio

# استيراد مدير الكاش
from .cache_manager import CacheManager

logger = logging.getLogger(__name__)

class MultiLLMOrchestrator:
    """
    منسق محسّن مع دعم AWS Bedrock ومعالجة أخطاء الاستيراد
    """
    
    def __init__(self, config: Dict[str, Any], cache_manager: Optional[CacheManager] = None):
        self.models: Dict[str, Any] = {}
        self.cache_manager = cache_manager
        self._initialize_models(config.get("models", {}))

    def _initialize_models(self, models_config: Dict[str, Any]):
        """تهيئة النماذج مع معالجة أخطاء الاستيراد"""
        
        # تحميل المفاتيح من متغيرات البيئة
        api_keys = {
            "google": os.environ.get("GOOGLE_API_KEY"),
            "openai": os.environ.get("OPENAI_API_KEY"),
            "anthropic": os.environ.get("ANTHROPIC_API_KEY"),
            "aws": os.environ.get("AWS_ACCESS_KEY_ID")  # للتحقق من وجود AWS
        }
        
        for key, conf in models_config.items():
            provider = conf.get("provider")
            model_name = conf.get("model_name")
            
            try:
                model = self._create_model(provider, model_name, api_keys)
                if model:
                    self.models[key] = model
                    logger.info(f"✅ تم تهيئة نموذج '{key}' ({provider} - {model_name})")
                else:
                    logger.warning(f"⚠️ لم يتم تهيئة نموذج '{key}' - المزود غير مدعوم: {provider}")
                    
            except Exception as e:
                logger.error(f"❌ فشل تهيئة نموذج '{key}'. خطأ: {e}")

    def _create_model(self, provider: str, model_name: str, api_keys: Dict) -> Optional[Any]:
        """إنشاء نموذج مع معالجة أخطاء الاستيراد"""
        try:
            if provider == "google":
                return self._create_google_model(model_name, api_keys["google"])
            
            elif provider == "openai":
                return self._create_openai_model(model_name, api_keys["openai"])
            
            elif provider == "anthropic":
                return self._create_anthropic_model(model_name, api_keys["anthropic"])
            
            elif provider == "aws_bedrock":
                return self._create_bedrock_model(model_name, api_keys["aws"])
            
            else:
                logger.warning(f"⚠️ مزود غير معروف: {provider}")
                return None
                
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء النموذج {provider}: {e}")
            return None

    def _create_google_model(self, model_name: str, api_key: str) -> Optional[Any]:
        """إنشاء نموذج Google مع بدائل"""
        if not api_key:
            raise ValueError("GOOGLE_API_KEY غير موجود")
        
        try:
            # المحاولة الأولى: langchain_google_genai
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=model_name, temperature=0.1, google_api_key=api_key
            )
        except ImportError:
            try:
                # المحاولة الثانية: langchain_community
                logger.warning("⚠️ langchain_google_genai غير مثبت - استخدام langchain_community")
                from langchain_community.chat_models import ChatGoogleGenerativeAI
                return ChatGoogleGenerativeAI(
                    model=model_name, temperature=0.1, google_api_key=api_key
                )
            except ImportError:
                logger.error("❌ فشل تحميل ChatGoogleGenerativeAI من أي مصدر")
                return None

    def _create_openai_model(self, model_name: str, api_key: str) -> Optional[Any]:
        """إنشاء نموذج OpenAI مع بدائل"""
        if not api_key:
            raise ValueError("OPENAI_API_KEY غير موجود")
        
        try:
            # المحاولة الأولى: langchain_openai
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=model_name, temperature=0.1, api_key=api_key
            )
        except ImportError:
            try:
                # المحاولة الثانية: langchain_community
                logger.warning("⚠️ langchain_openai غير مثبت - استخدام langchain_community")
                from langchain_community.chat_models import ChatOpenAI
                return ChatOpenAI(
                    model_name=model_name, temperature=0.1, openai_api_key=api_key
                )
            except ImportError:
                logger.error("❌ فشل تحميل ChatOpenAI من أي مصدر")
                return None

    def _create_anthropic_model(self, model_name: str, api_key: str) -> Optional[Any]:
        """إنشاء نموذج Anthropic مع بدائل"""
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY غير موجود")
        
        try:
            # المحاولة الأولى: langchain_anthropic
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                model=model_name, temperature=0.1, api_key=api_key
            )
        except ImportError:
            try:
                # المحاولة الثانية: langchain_community
                logger.warning("⚠️ langchain_anthropic غير مثبت - استخدام langchain_community")
                from langchain_community.chat_models import ChatAnthropic
                return ChatAnthropic(
                    model=model_name, temperature=0.1, anthropic_api_key=api_key
                )
            except ImportError:
                logger.error("❌ فشل تحميل ChatAnthropic من أي مصدر")
                return None

    def _create_bedrock_model(self, model_name: str, aws_key: str) -> Optional[Any]:
        """إنشاء نموذج AWS Bedrock"""
        if not aws_key:
            logger.warning("⚠️ مفاتيح AWS غير متوفرة - تخطي Bedrock")
            return None
        
        try:
            # المحاولة الأولى: langchain_aws
            try:
                from langchain_aws import ChatBedrock
                import boto3
                
                bedrock_client = boto3.client('bedrock-runtime', region_name=os.getenv('AWS_REGION', 'us-east-1'))
                return ChatBedrock(
                    model_id=model_name,
                    client=bedrock_client,
                    model_kwargs={"temperature": 0.1, "max_tokens": 4096}
                )
            except ImportError:
                # المحاولة الثانية: استخدام التنفيذ المباشر
                logger.warning("⚠️ langchain_aws غير مثبت - استخدام التنفيذ المباشر")
                from ..aws_services.bedrock_llm import AWSBedrockLLM
                bedrock_llm = AWSBedrockLLM()
                return bedrock_llm.get_model('claude_haiku')  # استخدام نموذج افتراضي
                
        except Exception as e:
            logger.error(f"❌ فشل إنشاء نموذج Bedrock: {e}")
            return None

    def get_model(self, model_key: str = "fast") -> Any:
        """الحصول على نموذج مع التعامل مع الأخطاء"""
        model = self.models.get(model_key)
        if not model:
            logger.warning(f"⚠️ النموذج '{model_key}' غير موجود. جاري استخدام نموذج بديل.")
            
            # محاولة العثور على أي نموذج متاح
            for key, available_model in self.models.items():
                if available_model:
                    logger.info(f"🔁 استخدام النموذج '{key}' كبديل")
                    return available_model
            
            # إذا لم يوجد أي نموذج، رفع خطأ
            raise RuntimeError("❌ لا توجد نماذج LLM متاحة. تأكد من تكوين المفاتيح والمكتبات.")
        
        return model

    async def generate_response_stream(
        self, 
        system_prompt: str, 
        human_prompt: str, 
        context: Optional[str] = None, 
        model_key: str = "fast"
    ) -> AsyncGenerator[str, None]:
        """
        إنشاء رد متدفق مع التعامل مع الأخطاء
        """
        try:
            model = self.get_model(model_key)
            
            if context:
                full_system_prompt = f"{system_prompt}\n\nالسياق:\n{context}"
            else:
                full_system_prompt = system_prompt
            
            # استخدام LangChain للبث
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import StrOutputParser
            
            prompt_template = ChatPromptTemplate.from_messages([
                ("system", full_system_prompt),
                ("human", "{input}")
            ])
            
            chain = prompt_template | model | StrOutputParser()
            
            logger.debug(f"بدء بث الاستجابة باستخدام نموذج '{model_key}'...")
            
            # البث المتدفق
            async for chunk in chain.astream({"input": human_prompt}):
                yield chunk
                await asyncio.sleep(0)  # للسماح بمهام أخرى

        except Exception as e:
            logger.error(f"❌ خطأ أثناء بث الاستجابة: {e}")
            yield f"\n\n[حدث خطأ في النظام: {e}]"

    async def generate_response(
        self, 
        system_prompt: str, 
        human_prompt: str, 
        context: Optional[str] = None, 
        model_key: str = "fast",
        use_cache: bool = True
    ) -> str:
        """
        إنشاء رد كامل مع دعم الكاش
        """
        
        # التحقق من الكاش
        cache_key = ""
        if self.cache_manager and use_cache:
            cache_key = f"llm_response:{model_key}:{system_prompt}:{human_prompt}:{context}"
            cached_response = await self.cache_manager.get(cache_key)
            if cached_response:
                logger.debug("LLM response (non-stream) HIT from cache.")
                return cached_response

        try:
            model = self.get_model(model_key)
            
            if context:
                full_system_prompt = f"{system_prompt}\n\nالسياق:\n{context}"
            else:
                full_system_prompt = system_prompt
                
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_core.output_parsers import StrOutputParser
            
            prompt_template = ChatPromptTemplate.from_messages([
                ("system", full_system_prompt),
                ("human", "{input}")
            ])
            
            chain = prompt_template | model | StrOutputParser()
            
            logger.debug(f"إنشاء استجابة كاملة باستخدام نموذج '{model_key}'...")
            response = await chain.ainvoke({"input": human_prompt})

            # تخزين في الكاش
            if self.cache_manager and use_cache:
                await self.cache_manager.set(cache_key, response, ttl=7200)

            return response
            
        except Exception as e:
            logger.error(f"❌ خطأ أثناء إنشاء الاستجابة: {e}")
            return f"[حدث خطأ في النظام: {e}]"

    def get_available_models(self) -> Dict[str, str]:
        """الحصول على قائمة النماذج المتاحة"""
        available = {}
        for key, model in self.models.items():
            if model:
                model_type = type(model).__name__
                available[key] = f"{model_type} (Active)"
            else:
                available[key] = "Not Available"
        return available