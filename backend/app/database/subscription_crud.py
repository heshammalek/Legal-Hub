# backend/app/database/subscription_crud.py
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import logging

from app.models.user_models import MembershipPlan, UserSubscription, Invoice, User
from app.schemas.subscription_schemas import MembershipPlanCreate, UserSubscriptionCreate, InvoiceBase

logger = logging.getLogger(__name__)

class SubscriptionCRUD:
    def __init__(self, db: Session):
        self.db = db

    # Membership Plans Operations
    def get_plan_by_id(self, plan_id: str) -> Optional[MembershipPlan]:
        return self.db.get(MembershipPlan, plan_id)

    def get_all_plans(self) -> List[MembershipPlan]:
        statement = select(MembershipPlan).where(MembershipPlan.is_active == True)
        return self.db.exec(statement).all()

    def create_plan(self, plan_data: MembershipPlanCreate) -> MembershipPlan:
        plan = MembershipPlan(
            id=str(uuid.uuid4()),
            **plan_data.dict()
        )
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    # User Subscriptions Operations
    def get_user_subscription(self, user_id: str) -> Optional[UserSubscription]:
        statement = select(UserSubscription).where(
            UserSubscription.user_id == user_id,
            UserSubscription.status == "active"
        )
        return self.db.exec(statement).first()

    def create_subscription(self, subscription_data: UserSubscriptionCreate, user_id: str) -> UserSubscription:
        # إنهاء أي اشتراكات سابقة
        old_subs = self.db.exec(
            select(UserSubscription).where(UserSubscription.user_id == user_id)
        ).all()
        
        for sub in old_subs:
            sub.status = "cancelled"
        
        # إنشاء اشتراك جديد
        subscription = UserSubscription(
            id=str(uuid.uuid4()),
            user_id=user_id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),
            status="active",
            **subscription_data.dict()
        )
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        return subscription

    def renew_subscription(self, subscription_id: str) -> UserSubscription:
        subscription = self.db.get(UserSubscription, subscription_id)
        if subscription:
            subscription.end_date = subscription.end_date + timedelta(days=30)
            subscription.status = "active"
            self.db.commit()
            self.db.refresh(subscription)
        return subscription

    # Invoices Operations
    def create_invoice(self, invoice_data: InvoiceBase, subscription_id: str) -> Invoice:
        invoice = Invoice(
            id=str(uuid.uuid4()),
            subscription_id=subscription_id,
            invoice_number=f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}",
            issue_date=datetime.utcnow(),
            status="pending",
            **invoice_data.dict()
        )
        self.db.add(invoice)
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def get_user_invoices(self, user_id: str) -> List[Invoice]:
        statement = select(Invoice).join(UserSubscription).where(
            UserSubscription.user_id == user_id
        ).order_by(Invoice.created_at.desc())
        return self.db.exec(statement).all()

    def update_invoice_status(self, invoice_id: str, status: str) -> Invoice:
        invoice = self.db.get(Invoice, invoice_id)
        if invoice:
            invoice.status = status
            self.db.commit()
            self.db.refresh(invoice)
        return invoice