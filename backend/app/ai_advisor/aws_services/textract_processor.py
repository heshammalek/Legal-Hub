import asyncio
import os
import boto3
import logging
import json
from typing import Dict, Any, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class TextractResult:
    text: str
    blocks: List[Dict]
    tables: List[Dict]
    forms: List[Dict]
    metadata: Dict[str, Any]

class AWSTextractProcessor:
    """معالجة PDF باستخدام Amazon Textract للتعرف على النص"""
    
    def __init__(self):
        self.textract_client = boto3.client('textract')
        self.s3_client = boto3.client('s3')
    
    async def process_pdf(self, pdf_path: str, s3_bucket: str = None) -> TextractResult:
        """معالجة PDF باستخدام Textract"""
        try:
            # إذا كان الملف محلياً، رفعه إلى S3 أولاً
            if s3_bucket:
                s3_key = f"temp-pdfs/{os.path.basename(pdf_path)}"
                self.s3_client.upload_file(pdf_path, s3_bucket, s3_key)
                
                response = self.textract_client.start_document_analysis(
                    DocumentLocation={
                        'S3Object': {
                            'Bucket': s3_bucket,
                            'Name': s3_key
                        }
                    },
                    FeatureTypes=['TABLES', 'FORMS'],
                    NotificationChannel={
                        'SNSTopicArn': os.getenv('TEXTRACT_SNS_TOPIC'),
                        'RoleArn': os.getenv('TEXTRACT_ROLE_ARN')
                    } if os.getenv('TEXTRACT_SNS_TOPIC') else None
                )
                
                # الانتظار حتى اكتمال المعالجة (في الإصدار الحقيقي نستخدم SNS)
                job_id = response['JobId']
                result = await self._wait_for_job_completion(job_id)
                
            else:
                # معالجة مباشرة للملف المحلي (للملفات الصغيرة)
                with open(pdf_path, 'rb') as document:
                    image_bytes = bytearray(document.read())
                
                response = self.textract_client.analyze_document(
                    Document={'Bytes': image_bytes},
                    FeatureTypes=['TABLES', 'FORMS']
                )
                result = response
            
            return self._parse_textract_result(result)
            
        except Exception as e:
            logger.error(f"❌ فشل معالجة PDF باستخدام Textract: {e}")
            raise
    
    async def _wait_for_job_completion(self, job_id: str, max_attempts: int = 30) -> Dict:
        """الانتظار حتى اكتمال مهمة Textract"""
        import time
        
        for attempt in range(max_attempts):
            try:
                response = self.textract_client.get_document_analysis(JobId=job_id)
                status = response['JobStatus']
                
                if status in ['SUCCEEDED', 'FAILED']:
                    return response
                
                logger.info(f"⏳ انتظار Textract... ({attempt + 1}/{max_attempts})")
                await asyncio.sleep(10)  # انتظار 10 ثواني
                
            except Exception as e:
                logger.warning(f"⚠️ خطأ في التحقق من حالة Textract: {e}")
                await asyncio.sleep(10)
        
        raise TimeoutError("انتهت مهلة انتظار معالجة Textract")
    
    def _parse_textract_result(self, response: Dict) -> TextractResult:
        """تحليل نتيجة Textract"""
        blocks = response.get('Blocks', [])
        text_blocks = [block for block in blocks if block['BlockType'] == 'LINE']
        tables = [block for block in blocks if block['BlockType'] == 'TABLE']
        forms = [block for block in blocks if block['BlockType'] == 'KEY_VALUE_SET']
        
        # استخراج النص
        full_text = "\n".join([block.get('Text', '') for block in text_blocks])
        
        # تحليل الجداول
        parsed_tables = self._parse_tables(tables, blocks)
        
        # تحليل النماذج
        parsed_forms = self._parse_forms(forms, blocks)
        
        return TextractResult(
            text=full_text,
            blocks=blocks,
            tables=parsed_tables,
            forms=parsed_forms,
            metadata={
                'document_type': 'law',
                'processed_by': 'aws_textract',
                'total_pages': len([b for b in blocks if b['BlockType'] == 'PAGE']),
                'confidence': self._calculate_confidence(blocks)
            }
        )
    
    def _parse_tables(self, tables: List[Dict], all_blocks: List[Dict]) -> List[Dict]:
        """تحليل الجداول من Textract"""
        parsed_tables = []
        
        for table in tables:
            table_data = {
                'rows': [],
                'columns': [],
                'cells': []
            }
            
            # استخراج خلايا الجدول
            relationships = table.get('Relationships', [])
            for relationship in relationships:
                if relationship['Type'] == 'CHILD':
                    for cell_id in relationship['Ids']:
                        cell_block = next((b for b in all_blocks if b['Id'] == cell_id), None)
                        if cell_block and cell_block['BlockType'] == 'CELL':
                            cell_data = {
                                'row_index': cell_block.get('RowIndex', 0),
                                'column_index': cell_block.get('ColumnIndex', 0),
                                'text': self._get_cell_text(cell_block, all_blocks)
                            }
                            table_data['cells'].append(cell_data)
            
            parsed_tables.append(table_data)
        
        return parsed_tables
    
    def _get_cell_text(self, cell_block: Dict, all_blocks: List[Dict]) -> str:
        """استخراج نص الخلية"""
        text_parts = []
        relationships = cell_block.get('Relationships', [])
        
        for relationship in relationships:
            if relationship['Type'] == 'CHILD':
                for word_id in relationship['Ids']:
                    word_block = next((b for b in all_blocks if b['Id'] == word_id), None)
                    if word_block and word_block['BlockType'] == 'WORD':
                        text_parts.append(word_block.get('Text', ''))
        
        return ' '.join(text_parts)
    
    def _parse_forms(self, forms: List[Dict], all_blocks: List[Dict]) -> List[Dict]:
        """تحليل النماذج من Textract"""
        parsed_forms = []
        
        key_blocks = [f for f in forms if f.get('EntityTypes', []) == ['KEY']]
        value_blocks = [f for f in forms if f.get('EntityTypes', []) == ['VALUE']]
        
        for key_block in key_blocks:
            key_text = self._get_block_text(key_block, all_blocks)
            
            # البحث عن القيم المرتبطة
            relationships = key_block.get('Relationships', [])
            for relationship in relationships:
                if relationship['Type'] == 'VALUE':
                    for value_id in relationship['Ids']:
                        value_block = next((b for b in all_blocks if b['Id'] == value_id), None)
                        if value_block:
                            value_text = self._get_block_text(value_block, all_blocks)
                            parsed_forms.append({
                                'key': key_text,
                                'value': value_text,
                                'confidence': key_block.get('Confidence', 0)
                            })
        
        return parsed_forms
    
    def _get_block_text(self, block: Dict, all_blocks: List[Dict]) -> str:
        """استخراج نص من كتلة Textract"""
        text_parts = []
        relationships = block.get('Relationships', [])
        
        for relationship in relationships:
            if relationship['Type'] == 'CHILD':
                for word_id in relationship['Ids']:
                    word_block = next((b for b in all_blocks if b['Id'] == word_id), None)
                    if word_block and word_block['BlockType'] in ['WORD', 'LINE']:
                        text_parts.append(word_block.get('Text', ''))
        
        return ' '.join(text_parts)
    
    def _calculate_confidence(self, blocks: List[Dict]) -> float:
        """حساب درجة الثقة الإجمالية"""
        confidences = [block.get('Confidence', 0) for block in blocks if block.get('Confidence')]
        return sum(confidences) / len(confidences) if confidences else 0.0