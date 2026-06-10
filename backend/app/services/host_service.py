from sqlalchemy.orm import Session
from typing import Optional, Tuple, List
from datetime import datetime, date, time
from ..models.host import Host
from ..models.host_schedule import HostSchedule
from ..models.user import User
from ..schemas.host import HostCreate, HostUpdate, HostScheduleCreate, HostScheduleUpdate
from fastapi import HTTPException, status


def get_host(db: Session, host_id: int) -> Optional[Host]:
    return db.query(Host).filter(Host.id == host_id).first()


def get_host_by_user_id(db: Session, user_id: int) -> Optional[Host]:
    return db.query(Host).filter(Host.user_id == user_id).first()


def get_host_by_nickname(db: Session, nickname: str) -> Optional[Host]:
    return db.query(Host).filter(Host.nickname == nickname).first()


def get_hosts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    keyword: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Tuple[List[Host], int]:
    query = db.query(Host)
    if keyword:
        query = query.filter(
            (Host.nickname.contains(keyword)) |
            (Host.specialties.contains(keyword))
        )
    if is_active is not None:
        query = query.filter(Host.is_active == is_active)
    total = query.count()
    return query.order_by(Host.created_at.desc()).offset(skip).limit(limit).all(), total


def create_host(db: Session, host_in: HostCreate) -> Host:
    user = db.query(User).filter(User.id == host_in.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    if get_host_by_user_id(db, user_id=host_in.user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该用户已是主持人"
        )
    if get_host_by_nickname(db, nickname=host_in.nickname):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="主持人昵称已存在"
        )
    db_host = Host(**host_in.model_dump())
    db.add(db_host)
    db.commit()
    db.refresh(db_host)
    return db_host


def update_host(db: Session, host_id: int, host_in: HostUpdate) -> Host:
    db_host = get_host(db, host_id)
    if not db_host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="主持人不存在"
        )
    if host_in.nickname and host_in.nickname != db_host.nickname:
        if get_host_by_nickname(db, nickname=host_in.nickname):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="主持人昵称已存在"
            )
    update_data = host_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_host, field, value)
    db_host.updated_at = datetime.utcnow()
    db.add(db_host)
    db.commit()
    db.refresh(db_host)
    return db_host


def delete_host(db: Session, host_id: int) -> bool:
    db_host = get_host(db, host_id)
    if not db_host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="主持人不存在"
        )
    db.delete(db_host)
    db.commit()
    return True


def get_host_schedule(db: Session, schedule_id: int) -> Optional[HostSchedule]:
    return db.query(HostSchedule).filter(HostSchedule.id == schedule_id).first()


def get_host_schedules(
    db: Session,
    host_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[HostSchedule], int]:
    query = db.query(HostSchedule)
    if host_id:
        query = query.filter(HostSchedule.host_id == host_id)
    if start_date:
        query = query.filter(HostSchedule.date >= start_date)
    if end_date:
        query = query.filter(HostSchedule.date <= end_date)
    if status:
        query = query.filter(HostSchedule.status == status)
    total = query.count()
    return query.order_by(HostSchedule.date, HostSchedule.start_time).offset(skip).limit(limit).all(), total


def create_host_schedule(db: Session, schedule_in: HostScheduleCreate) -> HostSchedule:
    host = get_host(db, schedule_in.host_id)
    if not host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="主持人不存在"
        )
    query = db.query(HostSchedule).filter(
        HostSchedule.host_id == schedule_in.host_id,
        HostSchedule.date == schedule_in.date,
        HostSchedule.start_time < schedule_in.end_time,
        HostSchedule.end_time > schedule_in.start_time,
    )
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该时间段已有排班"
        )
    db_schedule = HostSchedule(**schedule_in.model_dump())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


def update_host_schedule(
    db: Session,
    schedule_id: int,
    schedule_in: HostScheduleUpdate,
) -> HostSchedule:
    db_schedule = get_host_schedule(db, schedule_id)
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班不存在"
        )
    update_data = schedule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_schedule, field, value)
    db_schedule.updated_at = datetime.utcnow()
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


def delete_host_schedule(db: Session, schedule_id: int) -> bool:
    db_schedule = get_host_schedule(db, schedule_id)
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="排班不存在"
        )
    if db_schedule.session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该排班已关联场次，无法删除"
        )
    db.delete(db_schedule)
    db.commit()
    return True


def get_available_hosts(
    db: Session,
    date_val: date,
    start_time: time,
    end_time: time,
) -> List[Host]:
    available_schedules = db.query(HostSchedule).filter(
        HostSchedule.date == date_val,
        HostSchedule.start_time <= start_time,
        HostSchedule.end_time >= end_time,
        HostSchedule.status == "available",
        HostSchedule.session_id.is_(None),
    ).all()
    host_ids = [s.host_id for s in available_schedules]
    if not host_ids:
        return []
    return db.query(Host).filter(
        Host.id.in_(host_ids),
        Host.is_active == True,
        Host.accept_type != "none"
    ).all()
