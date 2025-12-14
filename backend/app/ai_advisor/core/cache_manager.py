import logging
import pickle
from typing import Any, Optional
import os

logger = logging.getLogger(__name__)

class CacheManager:
    """
    مدير كاش مرن - يعمل مع Redis أو بديل في الذاكرة
    """
    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.use_redis = True
        self.memory_cache = {}  # بديل في الذاكرة
        self.client = None
        self.pool = None

    async def initialize(self):
        """محاولة الاتصال بـ Redis، إذا فشل يستخدم الذاكرة"""
        try:
            import redis.asyncio as aioredis
            from redis.asyncio.connection import ConnectionPool
            
            self.pool = ConnectionPool.from_url(self.redis_url, max_connections=20, decode_responses=False)
            self.client = aioredis.Redis(connection_pool=self.pool)
            await self.client.ping()
            logger.info(f"✅ CacheManager: متصل بـ Redis بنجاح")
            self.use_redis = True
            return True
            
        except Exception as e:
            logger.warning(f"⚠️ CacheManager: فشل الاتصال بـ Redis. استخدام الذاكرة المؤقتة. {e}")
            self.use_redis = False
            self.client = None
            self.pool = None
            return True

    async def get(self, key: str) -> Any:
        """الحصول على قيمة من الكاش"""
        if self.use_redis and self.client:
            try:
                cached_data = await self.client.get(key)
                if cached_data:
                    logger.debug(f"Cache HIT (Redis) for key: {key[:50]}...")
                    return pickle.loads(cached_data)
                return None
            except Exception as e:
                logger.warning(f"Redis GET error: {e}")
                self.use_redis = False
        
        # استخدام الذاكرة كبديل
        value = self.memory_cache.get(key)
        if value:
            logger.debug(f"Cache HIT (Memory) for key: {key[:50]}...")
        return value

    async def set(self, key: str, value: Any, ttl: int = 3600):
        """تخزين قيمة في الكاش"""
        if self.use_redis and self.client:
            try:
                serialized_value = pickle.dumps(value)
                await self.client.set(key, serialized_value, ex=ttl)
                logger.debug(f"Cache SET (Redis) for key: {key[:50]}...")
                return
            except Exception as e:
                logger.warning(f"Redis SET error: {e}")
                self.use_redis = False
        
        # استخدام الذاكرة كبديل
        self.memory_cache[key] = value
        logger.debug(f"Cache SET (Memory) for key: {key[:50]}...")

    async def delete(self, key: str):
        """حذف مفتاح"""
        if self.use_redis and self.client:
            try:
                await self.client.delete(key)
            except Exception:
                self.use_redis = False
        
        self.memory_cache.pop(key, None)

    async def clear_all(self):
        """مسح الكاش"""
        if self.use_redis and self.client:
            try:
                await self.client.flushdb()
            except Exception:
                self.use_redis = False
        
        self.memory_cache.clear()

    async def close(self):
        """إغلاق الاتصالات"""
        if self.client:
            await self.client.close()
        if self.pool:
            await self.pool.disconnect()
        self.memory_cache.clear()