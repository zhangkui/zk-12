from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class RoomBase(BaseModel):
    name: str
    capacity: int
    description: Optional[str] = None
    equipment: Optional[str] = None
    location: Optional[str] = None


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    equipment: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None


class RoomResponse(RoomBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
