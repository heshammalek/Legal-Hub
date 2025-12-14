from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime

router = APIRouter()

# Schemas
class DocumentCreate(BaseModel):
    title: str
    content: str
    type: str
    category: str
    tags: List[str] = []

class DocumentResponse(BaseModel):
    id: str
    title: str
    content: str
    type: str
    category: str
    tags: List[str]
    created_at: datetime
    updated_at: datetime

class LibraryItem(BaseModel):
    id: str
    title: str
    content: str
    type: str
    category: str
    description: str
    language: str

# Mock data - سيتم استبدالها بقاعدة البيانات
mock_library = [
    {
        "id": "1",
        "title": "عقد إيجار تجاري",
        "content": "عقد إيجار تجاري...",
        "type": "contract",
        "category": "contracts",
        "description": "نموذج عقد إيجار للأغراض التجارية",
        "language": "ar"
    }
]

user_documents = []

@router.get("/library", response_model=List[LibraryItem])
async def get_library_items(
    category: Optional[str] = None,
    search: Optional[str] = None
):
    """الحصول على عناصر المكتبة"""
    filtered_items = mock_library
    
    if category and category != "all":
        filtered_items = [item for item in filtered_items if item["category"] == category]
    
    if search:
        filtered_items = [
            item for item in filtered_items
            if search.lower() in item["title"].lower() or 
            search.lower() in item["description"].lower()
        ]
    
    return filtered_items

@router.get("/documents", response_model=List[DocumentResponse])
async def get_user_documents():
    """الحصول على مستندات المستخدم"""
    return user_documents

@router.post("/documents", response_model=DocumentResponse)
async def create_document(document: DocumentCreate):
    """إنشاء مستند جديد"""
    new_doc = {
        "id": str(uuid.uuid4()),
        "title": document.title,
        "content": document.content,
        "type": document.type,
        "category": document.category,
        "tags": document.tags,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    user_documents.append(new_doc)
    return new_doc

@router.put("/documents/{document_id}", response_model=DocumentResponse)
async def update_document(document_id: str, document: DocumentCreate):
    """تحديث مستند"""
    for doc in user_documents:
        if doc["id"] == document_id:
            doc.update({
                "title": document.title,
                "content": document.content,
                "type": document.type,
                "category": document.category,
                "tags": document.tags,
                "updated_at": datetime.now()
            })
            return doc
    raise HTTPException(status_code=404, detail="Document not found")

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """حذف مستند"""
    global user_documents
    user_documents = [doc for doc in user_documents if doc["id"] != document_id]
    return {"message": "Document deleted successfully"}