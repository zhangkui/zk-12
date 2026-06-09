from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from ..core.database import get_db
from ..core.security import get_current_active_user, require_admin
from ..models.user import User
from ..models.order import OrderStatus
from ..schemas.order import OrderResponse, OrderCreate, OrderUpdate, OrderPay
from ..schemas.common import PaginatedResponse, APIResponse
from ..services.order_service import (
    get_orders,
    get_order,
    create_order,
    update_order,
    pay_order,
    cancel_order,
    get_daily_stats,
    enrich_order_response,
)

router = APIRouter(prefix="/orders", tags=["订单管理"])


@router.get("", response_model=PaginatedResponse[dict])
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = None,
    session_id: Optional[int] = None,
    status: Optional[OrderStatus] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in ["admin", "owner"]:
        user_id = current_user.id
    skip = (page - 1) * page_size
    orders, total = get_orders(
        db,
        skip=skip,
        limit=page_size,
        user_id=user_id,
        session_id=session_id,
        status=status,
        keyword=keyword,
    )
    total_pages = (total + page_size - 1) // page_size
    enriched_orders = [enrich_order_response(db, o) for o in orders]
    return PaginatedResponse(
        data=enriched_orders,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/stats/daily", response_model=APIResponse[dict])
def get_daily_statistics(
    date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    stats = get_daily_stats(db, date)
    return APIResponse(data=stats)


@router.get("/{order_id}", response_model=APIResponse[dict])
def get_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    order = get_order(db, order_id)
    if not order:
        return APIResponse(data=None)
    if current_user.role not in ["admin", "owner"] and order.user_id != current_user.id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看")
    return APIResponse(data=enrich_order_response(db, order))


@router.post("", response_model=APIResponse[OrderResponse])
def create_new_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    order = create_order(db, order_in)
    return APIResponse(message="创建成功", data=order)


@router.post("/{order_id}/pay", response_model=APIResponse[OrderResponse])
def pay_order_by_id(
    order_id: int,
    pay_in: OrderPay,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in ["admin", "owner"]:
        order = get_order(db, order_id)
        if order and order.user_id != current_user.id:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权支付")
    order = pay_order(db, order_id, pay_in)
    return APIResponse(message="支付成功", data=order)


@router.post("/{order_id}/cancel", response_model=APIResponse[OrderResponse])
def cancel_order_by_id(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in ["admin", "owner"]:
        order = get_order(db, order_id)
        if order and order.user_id != current_user.id:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权取消")
    order = cancel_order(db, order_id)
    return APIResponse(message="取消成功", data=order)


@router.put("/{order_id}", response_model=APIResponse[OrderResponse])
def update_order_by_id(
    order_id: int,
    order_in: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    order = update_order(db, order_id, order_in)
    return APIResponse(message="更新成功", data=order)
