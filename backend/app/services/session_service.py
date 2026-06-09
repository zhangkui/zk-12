from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from datetime import datetime, date, time
from decimal import Decimal
from ..models.session import Session as GameSession
from ..models.script import Script
from ..models.room import Room
from ..models.host import Host
from ..models.booking import Booking
from ..schemas.session import SessionCreate, SessionUpdate
from ..services.room_service import check_room_availability
from ..services.host_service import get_host
from fastapi import HTTPException, status


def get_session(db: Session, session_id: int) -> Optional[GameSession]:
    return db.query(GameSession).filter(GameSession.id == session_id).first()


def get_sessions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    script_id: Optional[int] = None,
    room_id: Optional[int] = None,
    host_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
) -> Tuple[List[GameSession], int]:
    query = db.query(GameSession)
    if script_id:
        query = query.filter(GameSession.script_id == script_id)
    if room_id:
        query = query.filter(GameSession.room_id == room_id)
    if host_id:
        query = query.filter(GameSession.host_id == host_id)
    if start_date:
        query = query.filter(GameSession.date >= start_date)
    if end_date:
        query = query.filter(GameSession.date <= end_date)
    if status:
        query = query.filter(GameSession.status == status)
    if keyword:
        query = query.join(Script).filter(
            Script.name.contains(keyword)
        )
    total = query.count()
    sessions = query.order_by(GameSession.date, GameSession.start_time).offset(skip).limit(limit).all()
    return sessions, total


def enrich_session_response(db: Session, session_obj: GameSession) -> dict:
    result = {
        **session_obj.__dict__,
        "script_name": session_obj.script.name if session_obj.script else None,
        "room_name": session_obj.room.name if session_obj.room else None,
        "host_name": session_obj.host.nickname if session_obj.host else None,
    }
    return result


def create_session(db: Session, session_in: SessionCreate) -> GameSession:
    script = db.query(Script).filter(Script.id == session_in.script_id).first()
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="剧本不存在"
        )
    room = db.query(Room).filter(Room.id == session_in.room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="房间不存在"
        )
    if room.capacity < session_in.max_players:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="房间容量不足"
        )
    if not check_room_availability(
        db,
        room_id=session_in.room_id,
        date=session_in.date,
        start_time=session_in.start_time,
        end_time=session_in.end_time,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该房间在所选时间段已被占用"
        )
    if session_in.host_id:
        host = get_host(db, session_in.host_id)
        if not host:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="主持人不存在"
            )
        from ..models.host_schedule import HostSchedule
        schedule = db.query(HostSchedule).filter(
            HostSchedule.host_id == session_in.host_id,
            HostSchedule.date == session_in.date,
            HostSchedule.start_time <= session_in.start_time,
            HostSchedule.end_time >= session_in.end_time,
            HostSchedule.status == "available",
            HostSchedule.session_id.is_(None),
        ).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="主持人在该时间段不可用"
            )

    db_session = GameSession(**session_in.model_dump())
    db.add(db_session)
    db.flush()

    if session_in.host_id:
        schedule.session_id = db_session.id
        schedule.status = "booked"
        db.add(schedule)

    db.commit()
    db.refresh(db_session)
    return db_session


def update_session(db: Session, session_id: int, session_in: SessionUpdate) -> GameSession:
    db_session = get_session(db, session_id)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="场次不存在"
        )
    room_id = session_in.room_id or db_session.room_id
    date_val = session_in.date or db_session.date
    start_time = session_in.start_time or db_session.start_time
    end_time = session_in.end_time or db_session.end_time

    if room_id != db_session.room_id or date_val != db_session.date or \
       start_time != db_session.start_time or end_time != db_session.end_time:
        if not check_room_availability(
            db,
            room_id=room_id,
            date=date_val,
            start_time=start_time,
            end_time=end_time,
            exclude_session_id=session_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该房间在所选时间段已被占用"
            )

    if session_in.host_id and session_in.host_id != db_session.host_id:
        from ..models.host_schedule import HostSchedule
        host = get_host(db, session_in.host_id)
        if not host:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="主持人不存在"
            )
        schedule = db.query(HostSchedule).filter(
            HostSchedule.host_id == session_in.host_id,
            HostSchedule.date == date_val,
            HostSchedule.start_time <= start_time,
            HostSchedule.end_time >= end_time,
            HostSchedule.status == "available",
            HostSchedule.session_id.is_(None),
        ).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="主持人在该时间段不可用"
            )
        if db_session.host_id:
            old_schedule = db.query(HostSchedule).filter(
                HostSchedule.host_id == db_session.host_id,
                HostSchedule.session_id == session_id,
            ).first()
            if old_schedule:
                old_schedule.session_id = None
                old_schedule.status = "available"
                db.add(old_schedule)
        schedule.session_id = db_session.id
        schedule.status = "booked"
        db.add(schedule)

    update_data = session_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_session, field, value)
    db_session.updated_at = datetime.utcnow()
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def delete_session(db: Session, session_id: int) -> bool:
    db_session = get_session(db, session_id)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="场次不存在"
        )
    bookings = db.query(Booking).filter(Booking.session_id == session_id).all()
    if bookings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该场次已有玩家报名，无法删除"
        )
    from ..models.host_schedule import HostSchedule
    schedules = db.query(HostSchedule).filter(HostSchedule.session_id == session_id).all()
    for schedule in schedules:
        schedule.session_id = None
        schedule.status = "available"
        db.add(schedule)
    db.delete(db_session)
    db.commit()
    return True


def update_session_status(db: Session, session_id: int, status: str) -> GameSession:
    db_session = get_session(db, session_id)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="场次不存在"
        )
    db_session.status = status
    db_session.updated_at = datetime.utcnow()
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def recalculate_session_players(db: Session, session_id: int) -> None:
    db_session = get_session(db, session_id)
    if not db_session:
        return
    confirmed_bookings = db.query(Booking).filter(
        Booking.session_id == session_id,
        Booking.status == "confirmed",
    ).all()
    total_players = sum(b.player_count for b in confirmed_bookings)
    db_session.current_players = total_players
    if total_players >= db_session.max_players:
        db_session.status = "full"
    elif total_players >= db_session.min_players and db_session.status in ["pending", "full"]:
        db_session.status = "confirmed"
    db.add(db_session)
    db.commit()
