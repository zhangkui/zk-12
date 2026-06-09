from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class BookingBase(BaseModel):
    session_id: int
    player_count: int = 1
    character_name: Optional[str] = None
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    player_count: Optional[int] = None
    character_name: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    player_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    session_info: Optional[dict] = None
    player_info: Optional[dict] = None
