from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from ..core.database import get_db
from ..core.security import get_current_active_user, require_admin
from ..models.user import User
from ..schemas.session import SessionResponse, SessionCreate, SessionUpdate, SessionDetailResponse
from ..schemas.common import PaginatedResponse, APIResponse
from ..services.session_service import (
    get_sessions,
    get_session,
    create_session,
    update_session,
    delete_session,
    update_session_status,
    enrich_session_response,
)

router = APIRouter(prefix="/sessions", tags=["场次管理"])


@router.get("", response_model=PaginatedResponse[dict])
def list_sessions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    script_id: Optional[int] = None,
    room_id: Optional[int] = None,
    host_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    skip = (page - 1) * page_size
    sessions, total = get_sessions(
        db,
        skip=skip,
        limit=page_size,
        script_id=script_id,
        room_id=room_id,
        host_id=host_id,
        start_date=start_date,
        end_date=end_date,
        status=status,
        keyword=keyword,
    )
    total_pages = (total + page_size - 1) // page_size
    enriched_sessions = [enrich_session_response(db, s) for s in sessions]
    return PaginatedResponse(
        data=enriched_sessions,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{session_id}", response_model=APIResponse[SessionDetailResponse])
def get_session_by_id(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session_obj = get_session(db, session_id)
    if not session_obj:
        return APIResponse(data=None)
    bookings_data = []
    for b in session_obj.bookings:
        bookings_data.append({
            "id": b.id,
            "player_id": b.player_id,
            "player_name": b.player.full_name or b.player.username,
            "player_count": b.player_count,
            "character_name": b.character_name,
            "status": b.status,
            "created_at": b.created_at,
        })
    result = {
        **enrich_session_response(db, session_obj),
        "script": {
            "id": session_obj.script.id,
            "name": session_obj.script.name,
            "min_players": session_obj.script.min_players,
            "max_players": session_obj.script.max_players,
            "duration_minutes": session_obj.script.duration_minutes,
        } if session_obj.script else None,
        "room": {
            "id": session_obj.room.id,
            "name": session_obj.room.name,
            "capacity": session_obj.room.capacity,
        } if session_obj.room else None,
        "host": {
            "id": session_obj.host.id,
            "nickname": session_obj.host.nickname,
            "avatar": session_obj.host.avatar,
        } if session_obj.host else None,
        "bookings": bookings_data,
    }
    return APIResponse(data=result)


@router.post("", response_model=APIResponse[SessionResponse])
def create_new_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    session_obj = create_session(db, session_in)
    return APIResponse(message="创建成功", data=session_obj)


@router.put("/{session_id}", response_model=APIResponse[SessionResponse])
def update_session_by_id(
    session_id: int,
    session_in: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    session_obj = update_session(db, session_id, session_in)
    return APIResponse(message="更新成功", data=session_obj)


@router.patch("/{session_id}/status", response_model=APIResponse[SessionResponse])
def change_session_status(
    session_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    session_obj = update_session_status(db, session_id, status)
    return APIResponse(message="状态更新成功", data=session_obj)


@router.delete("/{session_id}", response_model=APIResponse)
def delete_session_by_id(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    delete_session(db, session_id)
    return APIResponse(message="删除成功")
