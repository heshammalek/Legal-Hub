# backend/app/database/agenda_crud.py

from sqlmodel import Session, select
from app.models.agenda_models import Event
from app.schemas.agenda_schemas import EventCreate, EventUpdate
from datetime import datetime
from app.models.notifications.notification_model import Notification, NotificationType
from app.services.notification_service import NotificationService



def create_event(db: Session, event_in: EventCreate, lawyer_id: str) -> Event:
    # ✅ إنشاء event مع lawyer_id
    event_data = event_in.dict()
    event = Event(**event_data, lawyer_id=lawyer_id)
    
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def get_event_by_id(db: Session, event_id: str) -> Event | None:
    return db.get(Event, event_id)

def get_events_by_lawyer(db: Session, lawyer_id: str, start: datetime, end: datetime) -> list[Event]:
    statement = select(Event).where(
        Event.lawyer_id == lawyer_id,
        Event.start_time < end,
        Event.end_time > start
    ).order_by(Event.start_time.asc())  # ✅ إضافة ترتيب
    results = db.exec(statement)
    return results.all()

def update_event(db: Session, event: Event, event_in: EventUpdate) -> Event:
    update_data = event_in.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()  # ✅ تحديث updated_at
    
    for key, value in update_data.items():
        setattr(event, key, value)
        
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

def delete_event(db: Session, event: Event) -> None:
    db.delete(event)
    db.commit()


def create_event(db: Session, event_in: EventCreate, lawyer_id: str) -> Event:
    event_data = event_in.dict()
    event = Event(**event_data, lawyer_id=lawyer_id)
    
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # ✅ إنشاء إشعار حقيقي عند إضافة حدث
    try:
        from app.services.notification_service import NotificationService
        from app.models.user_models import LawyerProfile
        
        lawyer = db.get(LawyerProfile, lawyer_id)
        if lawyer and lawyer.profile:
            NotificationService.create_notification(
                db=db,
                recipient_id=lawyer.profile.user_id,
                title="تم إضافة موعد جديد 📅",
                message=f"تم إضافة '{event.title}' إلى الأجندة",
                notification_type="agenda_event",
                related_model="event",
                related_id=event.id
            )
            print(f"📢 تم إنشاء إشعار حقيقي للحدث: {event.title}")
    except Exception as e:
        print(f"⚠️ لم يتم إنشاء إشعار للحدث: {e}")
    
    return event

def update_event(db: Session, event: Event, event_in: EventUpdate) -> Event:
    update_data = event_in.dict(exclude_unset=True)
    update_data['updated_at'] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(event, key, value)
        
    db.add(event)
    db.commit()
    db.refresh(event)
    
    # ✅ إنشاء إشعار لتحديث الموعد
    try:
        from app.models.user_models import LawyerProfile
        lawyer = db.get(LawyerProfile, event.lawyer_id)
        if lawyer and lawyer.profile:
            NotificationService.create_agenda_notification(
                db=db,
                recipient_id=lawyer.profile.user_id,
                event=event,
                action_type="updated"
            )
    except Exception as e:
        print(f"⚠️ لم يتم إنشاء إشعار للتحديث: {e}")
    
    return event