import sys, os, random
from datetime import date
from sqlmodel import SQLModel, Session, create_engine, select
from cryptography.fernet import Fernet

# أضف مسار المشروع الجذري إلى الـ Python Path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# استيراد الإعدادات والأمان
from app.core.config import settings, get_encryption_key
from app.core.security import get_password_hash

# استيراد النماذج
from app.models import *


# استيراد العمليات على قاعدة البيانات
from app.database.crud import UserCRUD


# Create engine
engine = create_engine(str(settings.DATABASE_URL), echo=True)

def create_db_and_tables():
    print("🔄 Creating database tables...")
    SQLModel.metadata.create_all(engine)
    print("✅ Tables created successfully.")

def encrypt_payment_details(raw: str) -> str:
    key = get_encryption_key()
    f = Fernet(key)
    return f.encrypt(raw.encode()).decode()

def create_admin_user():
    with Session(engine) as session:
        existing_admin = session.exec(
            select(User).where(User.email == "admin@legalhub.com")
        ).first()

        if existing_admin:
            print("✅ Admin user already exists.")
            return existing_admin

        admin_data = {
            "email": "admin@legalhub.com",
            "phone": "+201000000000",
            "password": "Admin123!",
            "country": "Egypt",
            "role": UserRole.ADMIN,
            "full_name": "System Administrator",
            "national_id": "ADMIN001",
            "date_of_birth": date(1980, 1, 1)
        }

        admin_user = UserCRUD.create_user_with_profile(session, admin_data)
        print("✅ Admin user created successfully.")
        return admin_user

def create_sample_users():
    with Session(engine) as session:
        created_users = []

        users_data = [
            {
                "email": "user@example.com",
                "phone": "+201111111111",
                "password": "User123!",
                "country": "Egypt",
                "role": UserRole.ORDINARY,
                "full_name": "Ahmed Mohamed",
                "national_id": "29901010101010",
                "date_of_birth": date(1990, 1, 1)
            },
            {
                "email": "lawyer@example.com",
                "phone": "+201222222111",
                "password": "Lawyer123!",
                "country": "Egypt",
                "role": UserRole.LAWYER,
                "full_name": "Mohamed Ali, Esq.",
                "national_id": "28802020202111",
                "date_of_birth": date(1988, 2, 2),
                "specialized_fields": {
                    "bar_association": "Cairo Bar Association",
                    "registration_year": 2015,
                    "degree": LawyerDegree.SENIOR,
                    "specialization": "Civil and Commercial Law",
                    "registration_number": "CAI2015001",
                    "office_address": "Tahrir Square, Cairo",
                    "membership_status": MembershipStatus.ACTIVE,
                    "availability_status": AvailabilityStatus.AVAILABLE,
                    "rating": 4.7,
                    "emergency_available": True,
                    "lat": 30.0450,
                    "lng": 31.2357
                }
            },

            

###############################################################################


            {
                "email": "judge@example.com",
                "phone": "+201333333333",
                "password": "Judge123!",
                "country": "Egypt",
                "role": UserRole.JUDGE,
                "full_name": "Judge Mahmoud Hassan",
                "national_id": "27703030303030",
                "date_of_birth": date(1977, 3, 3),
                "specialized_fields": {
                    "registration_number": "JUD2023001",
                    "degree": "Circuit Court Judge",
                    "court": "Cairo Court of Appeals",
                    "court_circuit": "Commercial Circuit 5",
                    "is_active": True
                }
            },


##################################################################

            {
                "email": "expert@example.com",
                "phone": "+201444444444",
                "password": "Expert123!",
                "country": "Egypt",
                "role": UserRole.EXPERT,
                "full_name": "Dr. Sara Technical",
                "national_id": "26604040404040",
                "date_of_birth": date(1985, 4, 4),
                "specialized_fields": {
                    "workplace": "Technical Experts Co.",
                    "service_type": ServiceType.TECHNICAL,
                    "specialization": "Digital Forensics",
                    "availability_status": AvailabilityStatus.AVAILABLE,
                    "rating": 4.9,
                    "lat": 30.0480,
                    "lng": 31.2400
                }
            }
        ]

        for user_data in users_data:
            existing_user = session.exec(
                select(User).where(User.email == user_data["email"])
            ).first()

            if existing_user:
                print(f"✅ {user_data['role']} user already exists: {user_data['email']}")
                continue

            user = UserCRUD.create_user_with_profile(session, user_data)
            created_users.append(user)
            print(f"✅ {user.role} user created: {user.email}")

            # Add multiple payment methods
            if user.role == UserRole.LAWYER:
                lawyer_profile = session.exec(
                    select(LawyerProfile).where(LawyerProfile.user_id == user.id)
                ).first()
                payments = [
                    PaymentInfo(
                        method=PaymentMethod.BANK,
                        encrypted_details=encrypt_payment_details("CIB Bank - Acc: 123456789"),
                        lawyer_id=lawyer_profile.id
                    ),
                    PaymentInfo(
                        method=PaymentMethod.INSTAPAY,
                        encrypted_details=encrypt_payment_details("Instapay: 0123456789"),
                        lawyer_id=lawyer_profile.id
                    )
                ]
                session.add_all(payments)

            elif user.role == UserRole.EXPERT:
                expert_profile = session.exec(
                    select(ExpertProfile).where(ExpertProfile.user_id == user.id)
                ).first()
                payments = [
                    PaymentInfo(
                        method=PaymentMethod.INSTAPAY,
                        encrypted_details=encrypt_payment_details("Instapay: 0123456789"),
                        expert_id=expert_profile.id
                    )
                ]
                session.add_all(payments)

        session.commit()
        return created_users

def create_sample_documents():
    with Session(engine) as session:
        if session.exec(select(LegalDocument)).first():
            print("✅ Legal documents already exist.")
            return

        documents = [
            {
                "title": "نموذج دعوى مطالبة بدين",
                "category": "lawsuit",
                "country": "Egypt",
                "content": "نموذج قياسي لرفع دعوى مطالبة بدين وفقًا لقانون الإجراءات المدنية والتجارية...",
                "created_by": "admin",
                "is_public": True
            },
            {
                "title": "نموذج عقد بيع عقار",
                "category": "contract",
                "country": "Egypt",
                "content": "نموذج عقد بيع عقار شامل جميع البنود القانونية والشروط الوقائية...",
                "created_by": "admin",
                "is_public": True
            },
            {
                "title": "نموذج دفوع جنائية",
                "category": "defense",
                "country": "Egypt",
                "content": "نموذج مذكرات دفاع جنائي شامل لأهم الدفوع الشكلية والموضوعية...",
                "created_by": "admin",
                "is_public": False
            }
        ]

        for doc in documents:
            session.add(LegalDocument(**doc))
        session.commit()
        print(f"✅ {len(documents)} legal documents created.")

def create_sample_cases():
    with Session(engine) as session:
        if session.exec(select(Case)).first():
            print("✅ Sample cases already exist.")
            return

        client = session.exec(select(UserProfile).where(UserProfile.national_id == "29901010101010")).first()
        lawyer = session.exec(select(LawyerProfile).where(LawyerProfile.registration_number == "CAI2015001")).first()
        judge = session.exec(select(JudgeProfile).where(JudgeProfile.registration_number == "JUD2023001")).first()

        if not client or not lawyer:
            print("⚠️ Could not create sample cases - missing profiles")
            return

        case = Case(
            case_number=f"CASE-2024-{random.randint(1000, 9999)}",
            title="مطالبة بدين تجاري",
            description="دعوى مطالبة بدين ناتج عن تعاملات تجارية",
            client_id=client.id,
            lawyer_id=lawyer.id,
            judge_id=judge.id if judge else None,
            status=CaseStatus.IN_PROGRESS,
            court="محكمة التجارة بالقاهرة",
            amount=15000.0
        )

        session.add(case)
        session.commit()
        print("✅ Sample cases created.")

def initialize_database():
    print("🚀 Starting database initialization...")

    try:
        create_db_and_tables()
        create_admin_user()
        create_sample_users()
        create_sample_documents()
        create_sample_cases()

        print("🎉 Database initialization completed successfully!")
        print("📋 Admin login: admin@legalhub.com / Admin123!")

    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise

if __name__ == "__main__":
    initialize_database()
