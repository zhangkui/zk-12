from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_active_user, require_admin
from ..models.user import User
from ..schemas.room import RoomResponse, RoomCreate, RoomUpdate
from ..schemas.common import PaginatedResponse, APIResponse
from ..services.room_service import (
    get_rooms,
    get_room,
    create_room,
    update_room,
    delete_room,
)

router = APIRouter(prefix="/rooms", tags=["房间管理"])


@router.get("", response_model=PaginatedResponse[RoomResponse])
def list_rooms(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    min_capacity: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    skip = (page - 1) * page_size
    rooms, total = get_rooms(db, skip=skip, limit=page_size, min_capacity=min_capacity, is_active=is_active)
    total_pages = (total + page_size - 1) // page_size
    return PaginatedResponse(
        data=rooms,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{room_id}", response_model=APIResponse[RoomResponse])
def get_room_by_id(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    room = get_room(db, room_id)
    return APIResponse(data=room)


@router.post("", response_model=APIResponse[RoomResponse])
def create_new_room(
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    room = create_room(db, room_in)
    return APIResponse(message="创建成功", data=room)


@router.put("/{room_id}", response_model=APIResponse[RoomResponse])
def update_room_by_id(
    room_id: int,
    room_in: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    room = update_room(db, room_id, room_in)
    return APIResponse(message="更新成功", data=room)


@router.delete("/{room_id}", response_model=APIResponse)
def delete_room_by_id(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    delete_room(db, room_id)
    return APIResponse(message="删除成功")
