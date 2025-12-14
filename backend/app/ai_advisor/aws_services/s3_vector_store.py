from datetime import datetime
import os
import boto3
import json
import logging
import pickle
from typing import List, Dict, Any, Optional
import numpy as np
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class S3VectorStore:
    """تخزين المتجهات في Amazon S3 مع دعم البحث التقريبي"""
    
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = os.getenv('S3_VECTOR_BUCKET')
        self.index_prefix = "vector-index/"
    
    async def store_embeddings(self, document_id: str, chunks: List[Dict], embeddings: List[np.ndarray]):
        """تخزين المتجهات في S3"""
        try:
            vector_data = {
                'document_id': document_id,
                'chunks': chunks,
                'embeddings': [emb.tolist() for emb in embeddings],
                'metadata': {
                    'total_chunks': len(chunks),
                    'embedding_dim': len(embeddings[0]) if embeddings else 0,
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            key = f"{self.index_prefix}{document_id}/vectors.json"
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=json.dumps(vector_data),
                ContentType='application/json'
            )
            
            logger.info(f"✅ تم تخزين {len(embeddings)} متجه للمستند {document_id} في S3")
            
        except Exception as e:
            logger.error(f"❌ فشل تخزين المتجهات في S3: {e}")
            raise
    
    async def similarity_search(self, query_embedding: np.ndarray, limit: int = 10, 
                              filters: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """بحث بالتشابه في المتجهات المخزنة في S3"""
        try:
            # في الإصدار الأولي، نبحث في جميع الملفات
            # في الإصدار المتقدم يمكن استخدام AWS OpenSearch for kNN
            
            paginator = self.s3_client.get_paginator('list_objects_v2')
            results = []
            
            for page in paginator.paginate(Bucket=self.bucket_name, Prefix=self.index_prefix):
                for obj in page.get('Contents', []):
                    if obj['Key'].endswith('vectors.json'):
                        vector_data = self._load_vector_data(obj['Key'])
                        if vector_data:
                            chunk_results = self._calculate_similarities(
                                query_embedding, vector_data, filters
                            )
                            results.extend(chunk_results)
            
            # ترتيب النتائج حسب التشابه
            results.sort(key=lambda x: x['similarity'], reverse=True)
            return results[:limit]
            
        except Exception as e:
            logger.error(f"❌ فشل البحث في S3 Vector Store: {e}")
            return []
    
    def _load_vector_data(self, key: str) -> Optional[Dict]:
        """تحميل بيانات المتجهات من S3"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket_name, Key=key)
            data = json.loads(response['Body'].read().decode('utf-8'))
            return data
        except ClientError as e:
            logger.warning(f"⚠️无法加载向量数据 {key}: {e}")
            return None
    
    def _calculate_similarities(self, query_embedding: np.ndarray, 
                              vector_data: Dict, filters: Optional[Dict]) -> List[Dict]:
        """حساب التشابه بين المتجهات"""
        results = []
        query_emb = query_embedding.flatten()
        
        for i, (chunk, emb_list) in enumerate(zip(vector_data['chunks'], vector_data['embeddings'])):
            # تطبيق الفلاتر
            if filters and not self._passes_filters(chunk.get('metadata', {}), filters):
                continue
            
            # حساب التشابه (جيب التمام)
            chunk_emb = np.array(emb_list).flatten()
            similarity = self._cosine_similarity(query_emb, chunk_emb)
            
            if similarity > 0.6:  # عتبة التشابه
                results.append({
                    'content': chunk.get('text', ''),
                    'similarity': similarity,
                    'metadata': chunk.get('metadata', {}),
                    'document_id': vector_data['document_id'],
                    'chunk_index': i,
                    'search_type': 's3_vector'
                })
        
        return results
    
    def _cosine_similarity(self, a: np.ndarray, b: np.ndarray) -> float:
        """حساب تشابه جيب التمام"""
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        return dot_product / (norm_a * norm_b) if norm_a * norm_b > 0 else 0.0
    
    def _passes_filters(self, metadata: Dict, filters: Dict) -> bool:
        """التحقق من تطابق الفلاتر"""
        for key, value in filters.items():
            if metadata.get(key) != value:
                return False
        return True