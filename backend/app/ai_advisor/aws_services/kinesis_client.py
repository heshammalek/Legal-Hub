import os
import boto3
import json
import logging
from typing import Dict, Any, List
import asyncio

logger = logging.getLogger(__name__)

class KinesisDataStream:
    """إدارة تدفقات البيانات باستخدام Amazon Kinesis"""
    
    def __init__(self):
        self.kinesis_client = boto3.client('kinesis')
        self.stream_name = os.getenv('KINESIS_STREAM_NAME', 'legal-ai-stream')
    
    async def put_record(self, data: Dict[str, Any], partition_key: str = None):
        """إرسال سجل إلى Kinesis"""
        try:
            response = self.kinesis_client.put_record(
                StreamName=self.stream_name,
                Data=json.dumps(data),
                PartitionKey=partition_key or str(hash(json.dumps(data)))
            )
            
            logger.debug(f"✅ تم إرسال سجل إلى Kinesis: {response['SequenceNumber']}")
            return response
            
        except Exception as e:
            logger.error(f"❌ فشل إرسال سجل إلى Kinesis: {e}")
            raise
    
    async def put_batch_records(self, records: List[Dict[str, Any]]):
        """إرسال مجموعة من السجلات"""
        try:
            kinesis_records = []
            for record in records:
                kinesis_records.append({
                    'Data': json.dumps(record),
                    'PartitionKey': str(hash(json.dumps(record)))
                })
            
            response = self.kinesis_client.put_records(
                Records=kinesis_records,
                StreamName=self.stream_name
            )
            
            failed_count = response['FailedRecordCount']
            if failed_count > 0:
                logger.warning(f"⚠️ فشل إرسال {failed_count} سجل إلى Kinesis")
            else:
                logger.info(f"✅ تم إرسال {len(records)} سجل إلى Kinesis بنجاح")
                
            return response
            
        except Exception as e:
            logger.error(f"❌ فشل إرسال مجموعة السجلات إلى Kinesis: {e}")
            raise