from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal
from ..models.script import ScriptDifficulty, ScriptType


class ScriptBase(BaseModel):
    name: str
    author: Optional[str] = None
    publisher: Optional[str] = None
    description: Optional[str] = None
    difficulty: ScriptDifficulty = ScriptDifficulty.MEDIUM
    script_type: ScriptType = ScriptType.OTHER
    min_players: int
    max_players: int
    duration_minutes: int
    price: Decimal
    cover_image: Optional[str] = None
    images: Optional[str] = None
    tags: Optional[str] = None


class ScriptCreate(ScriptBase):
    pass


class ScriptUpdate(BaseModel):
    name: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[ScriptDifficulty] = None
    script_type: Optional[ScriptType] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    duration_minutes: Optional[int] = None
    price: Optional[Decimal] = None
    cover_image: Optional[str] = None
    images: Optional[str] = None
    tags: Optional[str] = None
    is_active: Optional[bool] = None


class ScriptResponse(ScriptBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
