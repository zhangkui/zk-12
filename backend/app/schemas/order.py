from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal
from ..models.order import OrderStatus, PaymentMethod


class OrderBase(BaseModel):
    user_id: int
    session_id: int
    booking_id: Optional[int] = None
    total_amount: Decimal
    discount_amount: Decimal = Decimal("0")
    actual_amount: Decimal
    payment_method: Optional[PaymentMethod] = None
    player_count: int = 1
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    payment_method: Optional[PaymentMethod] = None
    notes: Optional[str] = None


class OrderPay(BaseModel):
    payment_method: PaymentMethod
    amount: Decimal


class OrderResponse(OrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_no: str
    status: OrderStatus
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user_info: Optional[dict] = None
    session_info: Optional[dict] = None
