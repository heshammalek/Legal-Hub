from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Float
from database.connection import Base
from datetime import datetime

class InstitutionAdmin(Base):
    __tablename__ = "institution_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    
    country = Column(String, nullable=False)
    institution_code = Column(String, nullable=False)
    institution_name = Column(String, nullable=False)  # ✅ موجود في الداتابيز
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    subscription_start = Column(DateTime, default=datetime.utcnow)
    subscription_end = Column(DateTime, nullable=True)
    notification_sent_1month = Column(Boolean, default=False)
    notification_sent_1week = Column(Boolean, default=False)
    notification_sent_expired = Column(Boolean, default=False)
    notification_sent_2weeks_after = Column(Boolean, default=False)
    phone = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Teacher(Base):
    __tablename__ = "teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    country = Column(String, nullable=False)
    institution_code = Column(String, nullable=False)
    admin_id = Column(Integer, ForeignKey("institution_admins.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class StudyGroup(Base):
    __tablename__ = "study_groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    country = Column(String, nullable=False)
    institution_code = Column(String, nullable=False)
    admin_id = Column(Integer, ForeignKey("institution_admins.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    student_id = Column(String, nullable=True)
    country = Column(String, nullable=False)
    institution_code = Column(String, nullable=False)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=True)
    admin_id = Column(Integer, ForeignKey("institution_admins.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LegalCase(Base):
    __tablename__ = "legal_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    case_type = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CaseAttempt(Base):
    __tablename__ = "case_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    case_id = Column(Integer, ForeignKey("legal_cases.id"), nullable=True)
    attempt_number = Column(Integer, default=1)
    solution_text = Column(Text, nullable=True)
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    time_spent_minutes = Column(Integer, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

class EducationalContent(Base):
    __tablename__ = "educational_content"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(String, nullable=False)
    legal_domain = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    institution_code = Column(String, nullable=True)
    ai_generated = Column(Boolean, default=False)
    rag_prompt = Column(Text, nullable=True)
    learning_objectives = Column(JSON, nullable=True)
    status = Column(String, default="نشط")
    created_at = Column(DateTime, default=datetime.utcnow)

class StudentAssignment(Base):
    __tablename__ = "student_assignments"
    
    id = Column(Integer, primary_key=True, index=True)
    content_id = Column(Integer, ForeignKey("educational_content.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    institution_code = Column(String, nullable=True)
    submission_text = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("student_assignments.id"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    ai_evaluation = Column(JSON, nullable=True)
    teacher_feedback = Column(Text, nullable=True)
    final_score = Column(Integer, nullable=True)
    evaluated_at = Column(DateTime, default=datetime.utcnow)

class SimulationSession(Base):
    __tablename__ = "simulation_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("legal_cases.id"), nullable=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    role = Column(String, nullable=True)
    chat_log = Column(JSON, nullable=True)
    performance_metrics = Column(JSON, nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    status = Column(String, default="active")
    ai_analysis = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)