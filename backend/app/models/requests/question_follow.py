from sqlmodel import SQLModel, Field
from datetime import datetime
from uuid import uuid4

class QuestionFollow(SQLModel, table=True):
    __tablename__ = "question_follows"
    
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    question_id: str = Field(foreign_key="peer_questions.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)