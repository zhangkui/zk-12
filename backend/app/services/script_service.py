from sqlalchemy.orm import Session
from typing import Optional, Tuple
from datetime import datetime
from ..models.script import Script, ScriptDifficulty, ScriptType
from ..schemas.script import ScriptCreate, ScriptUpdate
from fastapi import HTTPException, status


def get_script(db: Session, script_id: int) -> Optional[Script]:
    return db.query(Script).filter(Script.id == script_id).first()


def get_script_by_name(db: Session, name: str) -> Optional[Script]:
    return db.query(Script).filter(Script.name == name).first()


def get_scripts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    difficulty: Optional[ScriptDifficulty] = None,
    script_type: Optional[ScriptType] = None,
    min_players: Optional[int] = None,
    max_players: Optional[int] = None,
    keyword: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> Tuple[list[Script], int]:
    query = db.query(Script)
    if difficulty:
        query = query.filter(Script.difficulty == difficulty)
    if script_type:
        query = query.filter(Script.script_type == script_type)
    if min_players:
        query = query.filter(Script.min_players <= min_players)
    if max_players:
        query = query.filter(Script.max_players >= max_players)
    if keyword:
        query = query.filter(
            (Script.name.contains(keyword)) |
            (Script.author.contains(keyword)) |
            (Script.description.contains(keyword)) |
            (Script.tags.contains(keyword))
        )
    if is_active is not None:
        query = query.filter(Script.is_active == is_active)
    total = query.count()
    return query.order_by(Script.created_at.desc()).offset(skip).limit(limit).all(), total


def create_script(db: Session, script_in: ScriptCreate) -> Script:
    if get_script_by_name(db, name=script_in.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="剧本名称已存在"
        )
    db_script = Script(
        name=script_in.name,
        author=script_in.author,
        publisher=script_in.publisher,
        description=script_in.description,
        difficulty=script_in.difficulty,
        script_type=script_in.script_type,
        min_players=script_in.min_players,
        max_players=script_in.max_players,
        duration_minutes=script_in.duration_minutes,
        price=script_in.price,
        cover_image=script_in.cover_image,
        images=script_in.images,
        tags=script_in.tags,
    )
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script


def update_script(db: Session, script_id: int, script_in: ScriptUpdate) -> Script:
    db_script = get_script(db, script_id)
    if not db_script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="剧本不存在"
        )
    if script_in.name and script_in.name != db_script.name:
        if get_script_by_name(db, name=script_in.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="剧本名称已存在"
            )
    update_data = script_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_script, field, value)
    db_script.updated_at = datetime.utcnow()
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    return db_script


def delete_script(db: Session, script_id: int) -> bool:
    db_script = get_script(db, script_id)
    if not db_script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="剧本不存在"
        )
    db.delete(db_script)
    db.commit()
    return True
