# backend/app/data_acquisition/metadata_manager.py
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

class MetadataManager:
    def __init__(self):
        # المسار المطلق علشان يتعامل مع أي مكان
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.base_path = os.path.join(current_dir, "..", "..", "data", "countries")
    
    def _load_json_file(self, file_path: str) -> Dict[str, Any]:
        """تحميل ملف JSON مع التعامل مع BOM"""
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            # إذا الملف مش موجود أو فيه خطأ، نرجع هيكل فارغ
            return {
                "country": "",
                "created_date": datetime.now().isoformat(),
                "total_documents": 0,
                "documents": []
            }
    
    def _save_json_file(self, file_path: str, data: Dict[str, Any]):
        """حفظ ملف JSON بدون BOM"""
        # تأكد من وجود المجلد
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def add_document_metadata(self, country: str, file_name: str, file_path: str, metadata: Dict[str, Any]) -> bool:
        """إضافة ميتاداتا وثيقة جديدة"""
        try:
            metadata_file = os.path.join(self.base_path, country, "metadata", "documents_metadata.json")
            print(f"📁 محاولة حفظ في: {metadata_file}")  # للديباڨ
            
            # تحميل الميتاداتا الحالية أو إنشاء جديدة
            data = self._load_json_file(metadata_file)
            
            # تحديث بيانات الدولة
            data["country"] = country
            data["last_updated"] = datetime.now().isoformat()
            
            # إنشاء وثيقة جديدة
            document_id = f"doc_{len(data['documents']) + 1:03d}"
            new_document = {
                "id": document_id,
                "file_name": file_name,
                "file_path": file_path,
                "metadata": {
                    **metadata,
                    "added_date": datetime.now().isoformat()
                }
            }
            
            # إضافة الوثيقة وتحديد العدد
            data["documents"].append(new_document)
            data["total_documents"] = len(data["documents"])
            
            # حفظ الملف
            self._save_json_file(metadata_file, data)
            
            print(f"✅ تم إضافة ميتاداتا: {file_name} في {metadata_file}")
            return True
            
        except Exception as e:
            print(f"❌ خطأ في إضافة الميتاداتا: {e}")
            import traceback
            traceback.print_exc()  # طباعة التفاصيل
            return False