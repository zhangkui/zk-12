from sqlalchemy.orm import Session
from typing import Optional, Tuple
from datetime import datetime
from ..models.room import Room
from ..schemas.room import RoomCreate, RoomUpdate
from fastapi import HTTPException, status


def get_room(db: Session, room_id: int) -> Optional[Room]:
    return db.query(Room).filter(Room.id == room_id).first()


def get_room_by_name(db: Session, name: str) -> Optional[Room]:
    return db.query(Room).filter(Room.name == name).first()


def get_rooms(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    min_capacity: Optional[int] = None,
    is_active: Optional[bool] = None,
) -> Tuple[list[Room], int]:
    query = db.query(Room)
    if min_capacity:
        query = query.filter(Room.capacity >= min_capacity)
    if is_active is not None:
        query = query.filter(Room.is_active == is_active)
    total = query.count()
    return query.order_by(Room.created_at.desc()).offset(skip).limit(limit).all(), total


def create_room(db: Session, room_in: RoomCreate) -> Room:
    if get_room_by_name(db, name=room_in.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="房间名称已存在"
        )
    db_room = Room(
        name=room_in.name,
        capacity=room_in.capacity,
        description=room_in.description,
        equipment=room_in.equipment,
        location=room_in.location,
    )
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room


def update_room(db: Session, room_id: int, room_in: RoomUpdate) -> Room:
    db_room = get_room(db, room_id)
    if not db_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="房间不存在"
        )
    if room_in.name and room_in.name != db_room.name:
        if get_room_by_name(db, name=room_in.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="房间名称已存在"
            )
    update_data = room_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_room, field, value)
    db_room.updated_at = datetime.utcnow()
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room


def delete_room(db: Session, room_id: int) -> bool:
    db_room = get_room(db, room_id)
    if not db_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="房间不存在"
        )
    db.delete(db_room)
    db.commit()
    return True


def check_room_availability(
    db: Session,
    room_id: int,
    date,
    start_time,
    end_time,
    exclude_session_id: Optional[int] = None,
) -> bool:
    from ..models.session import Session as GameSession
    query = db.query(GameSession).filter(
        GameSession.room_id == room_id,
        GameSession.date == date,
        GameSession.status != "cancelled",
        GameSession.start_time < end_time,
        GameSession.end_time > start_time,
    )
    if exclude_session_id:
        query = query.filter(GameSession.id != exclude_session_id)
    conflict = query.first()
    return conflict is None
