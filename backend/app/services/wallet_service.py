from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from datetime import datetime
from decimal import Decimal
import uuid
from ..models.user import User
from ..models.wallet import UserBalance, RechargeOrder, TransactionRecord, RechargeStatus, TransactionType
from ..models.order import Order, OrderStatus, PaymentMethod
from ..schemas.wallet import RechargeCreate, PaymentPasswordSet, PaymentPasswordUpdate, BalancePayRequest
from ..core.security import get_password_hash, verify_password
from fastapi import HTTPException, status


def generate_recharge_order_no() -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique = str(uuid.uuid4().hex)[:8].upper()
    return f"CZ{timestamp}{unique}"


def generate_transaction_no() -> str:
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    unique = str(uuid.uuid4().hex)[:8].upper()
    return f"JY{timestamp}{unique}"


def get_or_create_user_balance(db: Session, user_id: int) -> UserBalance:
    balance = db.query(UserBalance).filter(UserBalance.user_id == user_id).first()
    if not balance:
        balance = UserBalance(
            user_id=user_id,
            balance=Decimal("0"),
            frozen_balance=Decimal("0"),
            total_recharge=Decimal("0"),
            total_consumption=Decimal("0"),
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)
    return balance


def get_user_balance(db: Session, user_id: int) -> UserBalance:
    return get_or_create_user_balance(db, user_id)


def create_recharge_order(
    db: Session,
    recharge_in: RechargeCreate,
    operator_id: int,
) -> RechargeOrder:
    user = db.query(User).filter(User.id == recharge_in.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    order_no = generate_recharge_order_no()

    db_recharge = RechargeOrder(
        order_no=order_no,
        user_id=recharge_in.user_id,
        operator_id=operator_id,
        amount=recharge_in.amount,
        remark=recharge_in.remark,
        status=RechargeStatus.COMPLETED,
    )
    db.add(db_recharge)
    db.flush()

    user_balance = get_or_create_user_balance(db, recharge_in.user_id)
    old_balance = user_balance.balance
    user_balance.balance += recharge_in.amount
    user_balance.total_recharge += recharge_in.amount
    user_balance.updated_at = datetime.utcnow()

    transaction_no = generate_transaction_no()
    db_transaction = TransactionRecord(
        transaction_no=transaction_no,
        user_id=recharge_in.user_id,
        type=TransactionType.RECHARGE,
        amount=recharge_in.amount,
        balance_after=old_balance + recharge_in.amount,
        recharge_order_id=db_recharge.id,
        remark=recharge_in.remark or "管理员充值",
    )
    db.add(db_transaction)

    db.commit()
    db.refresh(db_recharge)
    db.refresh(user_balance)
    return db_recharge


def get_recharge_orders(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    operator_id: Optional[int] = None,
    status: Optional[RechargeStatus] = None,
) -> Tuple[List[RechargeOrder], int]:
    query = db.query(RechargeOrder)
    if user_id:
        query = query.filter(RechargeOrder.user_id == user_id)
    if operator_id:
        query = query.filter(RechargeOrder.operator_id == operator_id)
    if status:
        query = query.filter(RechargeOrder.status == status)
    total = query.count()
    return query.order_by(RechargeOrder.created_at.desc()).offset(skip).limit(limit).all(), total


def get_recharge_order(db: Session, recharge_id: int) -> Optional[RechargeOrder]:
    return db.query(RechargeOrder).filter(RechargeOrder.id == recharge_id).first()


def enrich_recharge_response(db: Session, recharge: RechargeOrder) -> dict:
    user = db.query(User).filter(User.id == recharge.user_id).first()
    operator = db.query(User).filter(User.id == recharge.operator_id).first()
    result = {
        "id": recharge.id,
        "order_no": recharge.order_no,
        "user_id": recharge.user_id,
        "operator_id": recharge.operator_id,
        "amount": recharge.amount,
        "remark": recharge.remark,
        "status": recharge.status,
        "created_at": recharge.created_at,
        "updated_at": recharge.updated_at,
        "user_info": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "phone": user.phone,
        } if user else None,
        "operator_info": {
            "id": operator.id,
            "username": operator.username,
            "full_name": operator.full_name,
        } if operator else None,
    }
    return result


def get_transaction_records(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    type: Optional[TransactionType] = None,
) -> Tuple[List[TransactionRecord], int]:
    query = db.query(TransactionRecord)
    if user_id:
        query = query.filter(TransactionRecord.user_id == user_id)
    if type:
        query = query.filter(TransactionRecord.type == type)
    total = query.count()
    return query.order_by(TransactionRecord.created_at.desc()).offset(skip).limit(limit).all(), total


def enrich_transaction_response(db: Session, transaction: TransactionRecord) -> dict:
    result = {
        "id": transaction.id,
        "transaction_no": transaction.transaction_no,
        "user_id": transaction.user_id,
        "type": transaction.type,
        "amount": transaction.amount,
        "balance_after": transaction.balance_after,
        "order_id": transaction.order_id,
        "recharge_order_id": transaction.recharge_order_id,
        "remark": transaction.remark,
        "created_at": transaction.created_at,
        "order_info": None,
    }
    if transaction.order_id:
        from ..services.order_service import get_order
        order = get_order(db, transaction.order_id)
        if order:
            result["order_info"] = {
                "id": order.id,
                "order_no": order.order_no,
                "status": order.status,
            }
    return result


def set_payment_password(
    db: Session,
    user_id: int,
    password_in: PaymentPasswordSet,
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    if user.hashed_payment_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="支付密码已设置，请使用修改功能"
        )
    user.hashed_payment_password = get_password_hash(password_in.payment_password)
    user.updated_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_payment_password(
    db: Session,
    user_id: int,
    password_in: PaymentPasswordUpdate,
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    if not user.hashed_payment_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先设置支付密码"
        )
    if not verify_password(password_in.old_payment_password, user.hashed_payment_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧支付密码错误"
        )
    user.hashed_payment_password = get_password_hash(password_in.new_payment_password)
    user.updated_at = datetime.utcnow()
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def check_payment_password(db: Session, user_id: int, payment_password: str) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.hashed_payment_password:
        return False
    return verify_password(payment_password, user.hashed_payment_password)


def has_payment_password(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    return user.hashed_payment_password is not None


def balance_pay_order(
    db: Session,
    order_id: int,
    user_id: int,
    pay_in: BalancePayRequest,
) -> Order:
    from ..services.order_service import get_order, confirm_booking

    order = get_order(db, order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="订单不存在"
        )

    if order.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权支付此订单"
        )

    if order.status == OrderStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单已支付"
        )
    if order.status == OrderStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="订单已取消"
        )
    if pay_in.amount != order.actual_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="支付金额与订单金额不符"
        )

    if not has_payment_password(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先设置支付密码"
        )

    if not check_payment_password(db, user_id, pay_in.payment_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="支付密码错误"
        )

    user_balance = get_or_create_user_balance(db, user_id)
    if user_balance.balance < pay_in.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="余额不足"
        )

    old_balance = user_balance.balance
    user_balance.balance -= pay_in.amount
    user_balance.total_consumption += pay_in.amount
    user_balance.updated_at = datetime.utcnow()

    order.status = OrderStatus.PAID
    order.payment_method = PaymentMethod.BALANCE
    order.paid_at = datetime.utcnow()
    order.updated_at = datetime.utcnow()

    transaction_no = generate_transaction_no()
    db_transaction = TransactionRecord(
        transaction_no=transaction_no,
        user_id=user_id,
        type=TransactionType.PAYMENT,
        amount=pay_in.amount,
        balance_after=old_balance - pay_in.amount,
        order_id=order.id,
        remark=f"订单支付: {order.order_no}",
    )
    db.add(db_transaction)

    db.add(user_balance)
    db.add(order)

    if order.booking_id:
        confirm_booking(db, order.booking_id)

    db.commit()
    db.refresh(order)
    db.refresh(user_balance)
    return order
