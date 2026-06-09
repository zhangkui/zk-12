from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from datetime import datetime
from ..models.booking import Booking
from ..models.session import Session as GameSession
from ..models.user import User
from ..schemas.booking import BookingCreate, BookingUpdate
from ..services.session_service import recalculate_session_players, get_session
from fastapi import HTTPException, status


def get_booking(db: Session, booking_id: int) -> Optional[Booking]:
    return db.query(Booking).filter(Booking.id == booking_id).first()


def get_bookings(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    session_id: Optional[int] = None,
    player_id: Optional[int] = None,
    status: Optional[str] = None,
) -> Tuple[List[Booking], int]:
    query = db.query(Booking)
    if session_id:
        query = query.filter(Booking.session_id == session_id)
    if player_id:
        query = query.filter(Booking.player_id == player_id)
    if status:
        query = query.filter(Booking.status == status)
    total = query.count()
    return query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all(), total


def enrich_booking_response(db: Session, booking: Booking) -> dict:
    result = {
        **booking.__dict__,
        "session_info": {
            "id": booking.session.id,
            "script_name": booking.session.script.name if booking.session.script else None,
            "date": booking.session.date,
            "start_time": booking.session.start_time,
            "end_time": booking.session.end_time,
            "room_name": booking.session.room.name if booking.session.room else None,
            "host_name": booking.session.host.nickname if booking.session.host else None,
        } if booking.session else None,
        "player_info": {
            "id": booking.player.id,
            "username": booking.player.username,
            "full_name": booking.player.full_name,
            "phone": booking.player.phone,
        } if booking.player else None,
    }
    return result


def create_booking(db: Session, booking_in: BookingCreate, player_id: int) -> Booking:
    session_obj = get_session(db, booking_in.session_id)
    if not session_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="场次不存在"
        )
    if session_obj.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该场次已取消"
        )
    if session_obj.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该场次已结束"
        )

    existing = db.query(Booking).filter(
        Booking.session_id == booking_in.session_id,
        Booking.player_id == player_id,
        Booking.status.in_(["pending", "confirmed", "waitlist"]),
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已报名该场次"
        )

    new_players = session_obj.current_players + booking_in.player_count
    if new_players > session_obj.max_players:
        status_val = "waitlist"
    else:
        status_val = "pending"

    db_booking = Booking(
        **booking_in.model_dump(),
        player_id=player_id,
        status=status_val,
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    recalculate_session_players(db, booking_in.session_id)

    return db_booking


def update_booking(db: Session, booking_id: int, booking_in: BookingUpdate) -> Booking:
    db_booking = get_booking(db, booking_id)
    if not db_booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名不存在"
        )
    old_status = db_booking.status
    update_data = booking_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_booking, field, value)
    db_booking.updated_at = datetime.utcnow()
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    if "status" in update_data or "player_count" in update_data:
        recalculate_session_players(db, db_booking.session_id)

    return db_booking


def cancel_booking(db: Session, booking_id: int, player_id: Optional[int] = None, is_admin: bool = False) -> Booking:
    db_booking = get_booking(db, booking_id)
    if not db_booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名不存在"
        )
    if not is_admin and db_booking.player_id != player_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权取消他人的报名"
        )
    if db_booking.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该报名已取消"
        )

    session_obj = get_session(db, db_booking.session_id)
    if session_obj and session_obj.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该场次已结束，无法取消"
        )

    db_booking.status = "cancelled"
    db_booking.updated_at = datetime.utcnow()
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    recalculate_session_players(db, db_booking.session_id)

    waitlist_bookings = db.query(Booking).filter(
        Booking.session_id == db_booking.session_id,
        Booking.status == "waitlist",
    ).order_by(Booking.created_at).all()

    session_obj = get_session(db, db_booking.session_id)
    if session_obj and waitlist_bookings:
        for wl_booking in waitlist_bookings:
            if session_obj.current_players + wl_booking.player_count <= session_obj.max_players:
                wl_booking.status = "pending"
                db.add(wl_booking)
                db.commit()
                recalculate_session_players(db, db_booking.session_id)
                session_obj = get_session(db, db_booking.session_id)
            else:
                break

    return db_booking


def confirm_booking(db: Session, booking_id: int) -> Booking:
    db_booking = get_booking(db, booking_id)
    if not db_booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="报名不存在"
        )
    if db_booking.status not in ["pending", "waitlist"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该报名状态无法确认"
        )
    session_obj = get_session(db, db_booking.session_id)
    if session_obj and db_booking.status == "waitlist":
        if session_obj.current_players + db_booking.player_count > session_obj.max_players:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="场次人数已满，无法确认"
            )
    db_booking.status = "confirmed"
    db_booking.updated_at = datetime.utcnow()
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    recalculate_session_players(db, db_booking.session_id)
    return db_booking
