from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, time
from ..core.database import get_db
from ..core.security import get_current_active_user, require_admin
from ..models.user import User
from ..schemas.host import HostResponse, HostCreate, HostUpdate
from ..schemas.common import PaginatedResponse, APIResponse
from ..services.host_service import (
    get_hosts,
    get_host,
    get_host_by_user_id,
    create_host,
    update_host,
    delete_host,
    get_available_hosts,
)

router = APIRouter(prefix="/hosts", tags=["主持人管理"])


@router.get("", response_model=PaginatedResponse[HostResponse])
def list_hosts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    skip = (page - 1) * page_size
    hosts, total = get_hosts(db, skip=skip, limit=page_size, keyword=keyword, is_active=is_active)
    total_pages = (total + page_size - 1) // page_size
    return PaginatedResponse(
        data=hosts,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/available", response_model=APIResponse[list[HostResponse]])
def get_available_hosts_for_time(
    date: date,
    start_time: time,
    end_time: time,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    hosts = get_available_hosts(db, date, start_time, end_time)
    return APIResponse(data=hosts)


@router.get("/{host_id}", response_model=APIResponse[HostResponse])
def get_host_by_id(
    host_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    host = get_host(db, host_id)
    return APIResponse(data=host)


@router.get("/user/{user_id}", response_model=APIResponse[HostResponse])
def get_host_by_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    host = get_host_by_user_id(db, user_id)
    return APIResponse(data=host)


@router.post("", response_model=APIResponse[HostResponse])
def create_new_host(
    host_in: HostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    host = create_host(db, host_in)
    return APIResponse(message="创建成功", data=host)


@router.put("/{host_id}", response_model=APIResponse[HostResponse])
def update_host_by_id(
    host_id: int,
    host_in: HostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    host = update_host(db, host_id, host_in)
    return APIResponse(message="更新成功", data=host)


@router.delete("/{host_id}", response_model=APIResponse)
def delete_host_by_id(
    host_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    delete_host(db, host_id)
    return APIResponse(message="删除成功")
