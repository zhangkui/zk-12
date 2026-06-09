from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from ..core.database import get_db
from ..core.security import get_current_active_user, require_admin
from ..models.user import User
from ..schemas.host import HostScheduleResponse, HostScheduleCreate, HostScheduleUpdate
from ..schemas.common import PaginatedResponse, APIResponse
from ..services.host_service import (
    get_host_schedules,
    get_host_schedule,
    create_host_schedule,
    update_host_schedule,
    delete_host_schedule,
)

router = APIRouter(prefix="/host-schedules", tags=["主持人排班"])


@router.get("", response_model=PaginatedResponse[HostScheduleResponse])
def list_schedules(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    host_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    skip = (page - 1) * page_size
    schedules, total = get_host_schedules(
        db,
        host_id=host_id,
        start_date=start_date,
        end_date=end_date,
        status=status,
        skip=skip,
        limit=page_size,
    )
    total_pages = (total + page_size - 1) // page_size
    return PaginatedResponse(
        data=schedules,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{schedule_id}", response_model=APIResponse[HostScheduleResponse])
def get_schedule_by_id(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    schedule = get_host_schedule(db, schedule_id)
    return APIResponse(data=schedule)


@router.post("", response_model=APIResponse[HostScheduleResponse])
def create_new_schedule(
    schedule_in: HostScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    schedule = create_host_schedule(db, schedule_in)
    return APIResponse(message="创建成功", data=schedule)


@router.put("/{schedule_id}", response_model=APIResponse[HostScheduleResponse])
def update_schedule_by_id(
    schedule_id: int,
    schedule_in: HostScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    schedule = update_host_schedule(db, schedule_id, schedule_in)
    return APIResponse(message="更新成功", data=schedule)


@router.delete("/{schedule_id}", response_model=APIResponse)
def delete_schedule_by_id(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    delete_host_schedule(db, schedule_id)
    return APIResponse(message="删除成功")
