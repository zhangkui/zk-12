from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date, time
from decimal import Decimal


class SessionBase(BaseModel):
    script_id: int
    room_id: int
    host_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time
    price: Decimal
    min_players: int
    max_players: int
    notes: Optional[str] = None


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    script_id: Optional[int] = None
    room_id: Optional[int] = None
    host_id: Optional[int] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    price: Optional[Decimal] = None
    min_players: Optional[int] = None
    max_players: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class SessionResponse(SessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    current_players: int
    status: str
    created_at: datetime
    updated_at: datetime
    script_name: Optional[str] = None
    room_name: Optional[str] = None
    host_name: Optional[str] = None


class SessionDetailResponse(SessionResponse):
    model_config = ConfigDict(from_attributes=True)

    script: Optional[dict] = None
    room: Optional[dict] = None
    host: Optional[dict] = None
    bookings: list[dict] = []
