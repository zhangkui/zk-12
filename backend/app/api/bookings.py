from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_active_user, require_admin
from ..models.user import User
from ..schemas.booking import BookingResponse, BookingCreate, BookingUpdate
from ..schemas.common import PaginatedResponse, APIResponse
from ..services.booking_service import (
    get_bookings,
    get_booking,
    create_booking,
    update_booking,
    cancel_booking,
    confirm_booking,
    enrich_booking_response,
)

router = APIRouter(prefix="/bookings", tags=["拼团报名"])


@router.get("", response_model=PaginatedResponse[dict])
def list_bookings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session_id: Optional[int] = None,
    player_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role not in ["admin", "owner"]:
        player_id = current_user.id
    skip = (page - 1) * page_size
    bookings, total = get_bookings(
        db,
        skip=skip,
        limit=page_size,
        session_id=session_id,
        player_id=player_id,
        status=status,
    )
    total_pages = (total + page_size - 1) // page_size
    enriched_bookings = [enrich_booking_response(db, b) for b in bookings]
    return PaginatedResponse(
        data=enriched_bookings,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{booking_id}", response_model=APIResponse[dict])
def get_booking_by_id(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    booking = get_booking(db, booking_id)
    if not booking:
        return APIResponse(data=None)
    if current_user.role not in ["admin", "owner"] and booking.player_id != current_user.id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权查看")
    return APIResponse(data=enrich_booking_response(db, booking))


@router.post("", response_model=APIResponse[BookingResponse])
def create_new_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    booking = create_booking(db, booking_in, player_id=current_user.id)
    return APIResponse(message="报名成功", data=booking)


@router.put("/{booking_id}", response_model=APIResponse[BookingResponse])
def update_booking_by_id(
    booking_id: int,
    booking_in: BookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    booking = update_booking(db, booking_id, booking_in)
    return APIResponse(message="更新成功", data=booking)


@router.post("/{booking_id}/confirm", response_model=APIResponse[BookingResponse])
def confirm_booking_by_id(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    booking = confirm_booking(db, booking_id)
    return APIResponse(message="确认成功", data=booking)


@router.post("/{booking_id}/cancel", response_model=APIResponse[BookingResponse])
def cancel_booking_by_id(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    is_admin = current_user.role in ["admin", "owner"]
    booking = cancel_booking(db, booking_id, player_id=current_user.id, is_admin=is_admin)
    return APIResponse(message="取消成功", data=booking)
