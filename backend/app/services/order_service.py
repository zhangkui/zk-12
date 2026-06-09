from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from datetime import datetime, date
from decimal import Decimal
import uuid
from ..models.order import Order, OrderStatus, PaymentMethod
from ..models.booking import Booking
from ..schemas.order import OrderCreate, OrderUpdate, OrderPay
from fastapi import HTTPException, status


def generate_order_no() -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique = str(uuid.uuid4().hex)[:8].upper()
    return f"DD{timestamp}{unique}"


def get_order(db: Session, order_id: int) -> Optional[Order]:
    return db.query(Order).filter(Order.id == order_id).first()


def get_order_by_no(db: Session, order_no: str) -> Optional[Order]:
    return db.query(Order).filter(Order.order_no == order_no).first()


def get_orders(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    session_id: Optional[int] = None,
    status: Optional[OrderStatus] = None,
    keyword: Optional[str] = None,
) -> Tuple[List[Order], int]:
    query = db.query(Order)
    if user_id:
        query = query.filter(Order.user_id == user_id)
    if session_id:
        query = query.filter(Order.session_id == session_id)
    if status:
        query = query.filter(Order.status == status)
    if keyword:
        query = query.filter(Order.order_no.contains(keyword))
    total = query.count()
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all(), total


def enrich_order_response(db: Session, order: Order) -> dict:
    result = {
        **order.__dict__,
        "user_info": {
            "id": order.user.id,
            "username": order.user.username,
            "full_name": order.user.full_name,
            "phone": order.user.phone,
        } if order.user else None,
        "session_info": {
            "id": order.session.id,
            "script_name": order.session.script.name if order.session.script else None,
            "date": order.session.date,
            "start_time": order.session.start_time,
            "room_name": order.session.room.name if order.session.room else None,
        } if order.session else None,
    }
    return result


def create_order(db: Session, order_in: OrderCreate) -> Order:
    order_no = generate_order_no()
    while get_order_by_no(db, order_no):
        order_no = generate_order_no()

    if order_in.booking_id:
        booking = db.query(Booking).filter(Booking.id == order_in.booking_id).first()
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="报名不存在"
            )

    db_order = Order(
        **order_in.model_dump(),
        order_no=order_no,
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def update_order(db: Session, order_id: int, order_in: OrderUpdate) -> Order:
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )
    update_data = order_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_order, field, value)
    db_order.updated_at = datetime.utcnow()
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def pay_order(db: Session, order_id: int, pay_in: OrderPay) -> Order:
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )
    if db_order.status == OrderStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单已支付"
        )
    if db_order.status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单已取消"
        )
    if pay_in.amount != db_order.actual_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="支付金额与订单金额不符"
        )

    db_order.status = OrderStatus.PAID
    db_order.payment_method = pay_in.payment_method
    db_order.paid_at = datetime.utcnow()
    db_order.updated_at = datetime.utcnow()
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    if db_order.booking_id:
        from ..services.booking_service import confirm_booking
        confirm_booking(db, db_order.booking_id)

    return db_order


def cancel_order(db: Session, order_id: int) -> Order:
    db_order = get_order(db, order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )
    if db_order.status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单已取消"
        )
    if db_order.status == OrderStatus.PAID:
        db_order.status = OrderStatus.REFUNDED
    else:
        db_order.status = OrderStatus.CANCELLED
    db_order.updated_at = datetime.utcnow()
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


def get_daily_stats(db: Session, date_val: Optional[date] = None) -> dict:
    from ..models.session import Session as GameSession
    if not date_val:
        date_val = datetime.now().date()
    orders = db.query(Order).filter(
        Order.created_at >= datetime.combine(date_val, datetime.min.time()),
        Order.created_at <= datetime.combine(date_val, datetime.max.time()),
    ).all()
    sessions = db.query(GameSession).filter(GameSession.date == date_val).all()
    total_revenue = sum(o.actual_amount for o in orders if o.status == OrderStatus.PAID)
    order_count = len(orders)
    paid_count = len([o for o in orders if o.status == OrderStatus.PAID])
    session_count = len(sessions)
    return {
        "date": date_val,
        "total_revenue": float(total_revenue),
        "order_count": order_count,
        "paid_count": paid_count,
        "session_count": session_count,
        "avg_order_amount": float(total_revenue) / paid_count if paid_count > 0 else 0,
    }
