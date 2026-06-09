from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_active_user, require_admin
from ..models.user import UserRole, User
from ..schemas.user import UserResponse, UserUpdate, UserCreate, UserChangePassword
from ..schemas.common import PaginatedResponse, APIResponse
from ..services.user_service import (
    get_users,
    get_user,
    create_user,
    update_user,
    delete_user,
    change_password,
)

router = APIRouter(prefix="/users", tags=["用户管理"])


@router.get("", response_model=PaginatedResponse[UserResponse])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    skip = (page - 1) * page_size
    users, total = get_users(db, skip=skip, limit=page_size, role=role, keyword=keyword)
    total_pages = (total + page_size - 1) // page_size
    return PaginatedResponse(
        data=users,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{user_id}", response_model=APIResponse[UserResponse])
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    user = get_user(db, user_id)
    return APIResponse(data=user)


@router.post("", response_model=APIResponse[UserResponse])
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = create_user(db, user_in)
    return APIResponse(message="创建成功", data=user)


@router.put("/{user_id}", response_model=APIResponse[UserResponse])
def update_user_by_id(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.id != user_id and current_user.role not in ["admin", "owner"]:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权修改他人信息")
    user = update_user(db, user_id, user_in)
    return APIResponse(message="更新成功", data=user)


@router.put("/{user_id}/password", response_model=APIResponse)
def change_user_password(
    user_id: int,
    password_in: UserChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.id != user_id and current_user.role not in ["admin", "owner"]:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无权修改他人密码")
    change_password(db, user_id, password_in.old_password, password_in.new_password)
    return APIResponse(message="密码修改成功")


@router.delete("/{user_id}", response_model=APIResponse)
def delete_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    delete_user(db, user_id)
    return APIResponse(message="删除成功")
