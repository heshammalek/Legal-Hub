import asyncio
import boto3
import json
import logging
from typing import Dict, Any, Optional, AsyncGenerator
from langchain_aws import ChatBedrock
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)

class AWSBedrockLLM:
    """استخدام Amazon Bedrock للنماذج اللغوية"""
    
    def __init__(self):
        self.bedrock_client = boto3.client('bedrock-runtime')
        self.available_models = self._get_available_models()
    
    def _get_available_models(self) -> Dict[str, str]:
        """الحصول على النماذج المتاحة في Bedrock"""
        return {
            'claude_haiku': 'anthropic.claude-3-haiku-20240307-v1:0',
            'claude_sonnet': 'anthropic.claude-3-sonnet-20240229-v1:0',
            'claude_opus': 'anthropic.claude-3-opus-20240229-v1:0',
            'llama3': 'meta.llama3-8b-instruct-v1:0',
            'titan': 'amazon.titan-text-express-v1'
        }
    
    def get_model(self, model_key: str = 'claude_haiku') -> str:
        """الحصول على معرف نموذج Bedrock"""
        try:
            model_id = self.available_models.get(model_key)
            if not model_id:
                raise ValueError(f"النموذج {model_key} غير متوفر")
            
            logger.info(f"✅ تم اختيار نموذج Bedrock: {model_key} -> {model_id}")
            return model_id
            
        except Exception as e:
            logger.error(f"❌ فشل الحصول على معرف نموذج Bedrock: {e}")
            raise
    
    async def generate_response(self, system_prompt: str, human_prompt: str, 
                                context: Optional[str] = None,
                                model_key: str = 'claude_haiku') -> str:
        """إنشاء رد باستخدام Bedrock عبر boto3 invoke_model"""
        try:
            model_id = self.get_model(model_key)
            
            if context:
                full_system_prompt = f"{system_prompt}\n\nالسياق:\n{context}"
            else:
                full_system_prompt = system_prompt
            
            # Build a simple text input combining system and human prompts
            full_input = f"{full_system_prompt}\n\n{human_prompt}"
            
            def invoke():
                return self.bedrock_client.invoke_model(
                    modelId=model_id,
                    contentType='application/json',
                    accept='application/json',
                    body=json.dumps({"input": full_input})
                )
            
            resp = await asyncio.to_thread(invoke)
            
            # Read and decode response body if present
            body = resp.get('body')
            raw = None
            if hasattr(body, 'read'):
                raw_bytes = body.read()
                if isinstance(raw_bytes, (bytes, bytearray)):
                    raw = raw_bytes.decode('utf-8', errors='ignore')
                else:
                    raw = str(raw_bytes)
            else:
                raw = str(body)
            
            # Try to parse JSON response, otherwise return raw text
            try:
                parsed = json.loads(raw)
                # Common keys that might contain model output
                for key in ('output', 'text', 'content', 'result', 'response', 'outputs'):
                    if isinstance(parsed, dict) and key in parsed:
                        return parsed[key] if not isinstance(parsed[key], (dict, list)) else json.dumps(parsed[key], ensure_ascii=False)
                # Fallback: return pretty JSON
                return json.dumps(parsed, ensure_ascii=False)
            except Exception:
                return raw
            
        except Exception as e:
            logger.error(f"❌ فشل إنشاء الرد باستخدام Bedrock: {e}")
            return f"[خطأ في Bedrock: {e}]"
    
    async def generate_response_stream(self, system_prompt: str, human_prompt: str,
                                       context: Optional[str] = None,
                                       model_key: str = 'claude_haiku') -> AsyncGenerator[str, None]:
        """إنشاء رد متدفق باستخدام Bedrock — التنفيذ البسيط: إرجاع الرد الكامل كمقطع واحد"""
        try:
            # For simplicity, reuse generate_response and yield the complete response once.
            response = await self.generate_response(system_prompt, human_prompt, context=context, model_key=model_key)
            yield response
                
        except Exception as e:
            logger.error(f"❌ فشل البث باستخدام Bedrock: {e}")
            yield f"[خطأ في Bedrock: {e}]"