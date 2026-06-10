from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_active_user, require_admin
from ..models.user import User
from ..models.wallet import RechargeStatus, TransactionType
from ..schemas.wallet import (
    UserBalanceResponse,
    RechargeCreate,
    RechargeOrderResponse,
    TransactionRecordResponse,
    PaymentPasswordSet,
    PaymentPasswordUpdate,
    BalancePayRequest,
)
from ..schemas.common import PaginatedResponse, APIResponse
from ..services.wallet_service import (
    get_user_balance,
    create_recharge_order,
    get_recharge_orders,
    get_recharge_order,
    enrich_recharge_response,
    get_transaction_records,
    enrich_transaction_response,
    set_payment_password,
    update_payment_password,
    has_payment_password,
    balance_pay_order,
)

router = APIRouter(prefix="/wallet", tags=["钱包管理"])


@router.get("/balance", response_model=APIResponse[UserBalanceResponse])
def get_balance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    balance = get_user_balance(db, current_user.id)
    return APIResponse(data=balance)


@router.get("/balance/{user_id}", response_model=APIResponse[UserBalanceResponse])
def get_user_balance_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    balance = get_user_balance(db, user_id)
    return APIResponse(data=balance)


@router.get("/has-payment-password", response_model=APIResponse[bool])
def check_has_payment_password(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    has = has_payment_password(db, current_user.id)
    return APIResponse(data=has)


@router.post("/payment-password", response_model=APIResponse)
def set_user_payment_password(
    password_in: PaymentPasswordSet,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    set_payment_password(db, current_user.id, password_in)
    return APIResponse(message="支付密码设置成功")


@router.put("/payment-password", response_model=APIResponse)
def update_user_payment_password(
    password_in: PaymentPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    update_payment_password(db, current_user.id, password_in)
    return APIResponse(message="支付密码修改成功")


@router.post("/recharge", response_model=APIResponse[RechargeOrderResponse])
def create_recharge(
    recharge_in: RechargeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    recharge = create_recharge_order(db, recharge_in, current_user.id)
    return APIResponse(message="充值成功", data=enrich_recharge_response(db, recharge))


@router.get("/recharges", response_model=PaginatedResponse[dict])
def list_recharges(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    status: Optional[RechargeStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in ["admin", "owner"]:
        user_id = current_user.id
    skip = (page - 1) * page_size
    recharges, total = get_recharge_orders(
        db,
        skip=skip,
        limit=page_size,
        user_id=user_id,
        status=status,
    )
    total_pages = (total + page_size - 1) // page_size
    enriched = [enrich_recharge_response(db, r) for r in recharges]
    return PaginatedResponse(
        data=enriched,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/recharges/{recharge_id}", response_model=APIResponse[dict])
def get_recharge_by_id(
    recharge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    recharge = get_recharge_order(db, recharge_id)
    if not recharge:
        return APIResponse(data=None)
    if current_user.role not in ["admin", "owner"] and recharge.user_id != current_user.id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看")
    return APIResponse(data=enrich_recharge_response(db, recharge))


@router.get("/transactions", response_model=PaginatedResponse[dict])
def list_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    type: Optional[TransactionType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in ["admin", "owner"]:
        user_id = current_user.id
    skip = (page - 1) * page_size
    transactions, total = get_transaction_records(
        db,
        skip=skip,
        limit=page_size,
        user_id=user_id,
        type=type,
    )
    total_pages = (total + page_size - 1) // page_size
    enriched = [enrich_transaction_response(db, t) for t in transactions]
    return PaginatedResponse(
        data=enriched,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/pay/{order_id}", response_model=APIResponse)
def pay_with_balance(
    order_id: int,
    pay_in: BalancePayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    order = balance_pay_order(db, order_id, current_user.id, pay_in)
    return APIResponse(message="支付成功", data={"order_id": order.id, "status": order.status})
