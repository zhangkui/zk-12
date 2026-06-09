from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..core.database import get_db
from ..core.security import get_current_active_user, require_admin
from ..models.user import User
from ..models.script import ScriptDifficulty, ScriptType
from ..schemas.script import ScriptResponse, ScriptCreate, ScriptUpdate
from ..schemas.common import PaginatedResponse, APIResponse
from ..services.script_service import (
    get_scripts,
    get_script,
    create_script,
    update_script,
    delete_script,
)

router = APIRouter(prefix="/scripts", tags=["剧本管理"])


@router.get("", response_model=PaginatedResponse[ScriptResponse])
def list_scripts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    difficulty: Optional[ScriptDifficulty] = None,
    script_type: Optional[ScriptType] = None,
    min_players: Optional[int] = None,
    max_players: Optional[int] = None,
    keyword: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    skip = (page - 1) * page_size
    scripts, total = get_scripts(
        db,
        skip=skip,
        limit=page_size,
        difficulty=difficulty,
        script_type=script_type,
        min_players=min_players,
        max_players=max_players,
        keyword=keyword,
        is_active=is_active,
    )
    total_pages = (total + page_size - 1) // page_size
    return PaginatedResponse(
        data=scripts,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{script_id}", response_model=APIResponse[ScriptResponse])
def get_script_by_id(
    script_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    script = get_script(db, script_id)
    return APIResponse(data=script)


@router.post("", response_model=APIResponse[ScriptResponse])
def create_new_script(
    script_in: ScriptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    script = create_script(db, script_in)
    return APIResponse(message="创建成功", data=script)


@router.put("/{script_id}", response_model=APIResponse[ScriptResponse])
def update_script_by_id(
    script_id: int,
    script_in: ScriptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    script = update_script(db, script_id, script_in)
    return APIResponse(message="更新成功", data=script)


@router.delete("/{script_id}", response_model=APIResponse)
def delete_script_by_id(
    script_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    delete_script(db, script_id)
    return APIResponse(message="删除成功")
