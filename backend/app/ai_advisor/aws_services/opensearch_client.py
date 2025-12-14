import os
import boto3
import logging
from typing import List, Dict, Any, Optional
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth

logger = logging.getLogger(__name__)

class AWSRetriever:
    """مسترجِع باستخدام Amazon OpenSearch للبحث الدلالي المتقدم"""
    
    def __init__(self):
        self.client = self._create_opensearch_client()
        self.index_name = "legal-documents"
    
    def _create_opensearch_client(self):
        """إنشاء عميل OpenSearch مع مصادقة AWS"""
        try:
            session = boto3.Session()
            credentials = session.get_credentials()
            
            aws_auth = AWS4Auth(
                credentials.access_key,
                credentials.secret_key,
                session.region_name,
                'es',
                session_token=credentials.token
            )
            
            host = os.getenv('OPENSEARCH_HOST')
            client = OpenSearch(
                hosts=[{'host': host, 'port': 443}],
                http_auth=aws_auth,
                use_ssl=True,
                verify_certs=True,
                connection_class=RequestsHttpConnection
            )
            
            logger.info("✅ تم الاتصال بـ Amazon OpenSearch")
            return client
            
        except Exception as e:
            logger.error(f"❌ فشل الاتصال بـ OpenSearch: {e}")
            raise
    
    async def semantic_search(self, query: str, max_results: int = 10, 
                            filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """بحث دلالي متقدم في OpenSearch"""
        try:
            # بناء استعلام البحث
            search_body = {
                "size": max_results,
                "query": {
                    "bool": {
                        "must": {
                            "multi_match": {
                                "query": query,
                                "fields": ["content^2", "title", "metadata.*"]
                            }
                        }
                    }
                }
            }
            
            # تطبيق الفلاتر
            if filters:
                filter_conditions = []
                if filters.get('document_type'):
                    filter_conditions.append({"term": {"metadata.document_type": filters['document_type']}})
                if filters.get('jurisdiction'):
                    filter_conditions.append({"term": {"metadata.jurisdiction": filters['jurisdiction']}})
                
                if filter_conditions:
                    search_body["query"]["bool"]["filter"] = filter_conditions
            
            response = self.client.search(
                index=self.index_name,
                body=search_body
            )
            
            # تنسيق النتائج
            results = []
            for hit in response['hits']['hits']:
                source = hit['_source']
                results.append({
                    'content': source.get('content', ''),
                    'similarity': hit['_score'],
                    'metadata': source.get('metadata', {}),
                    'article_number': source.get('article_number'),
                    'document_title': source.get('title', ''),
                    'confidence': min(1.0, hit['_score'] / 10.0),  # تحويل النتيجة إلى ثقة
                    'search_type': 'aws_opensearch'
                })
            
            logger.info(f"🔍 AWS OpenSearch: تم العثور على {len(results)} نتيجة")
            return results
            
        except Exception as e:
            logger.error(f"❌ فشل البحث في OpenSearch: {e}")
            return []