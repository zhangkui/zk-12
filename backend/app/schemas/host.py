from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime, date, time
from decimal import Decimal


class HostBase(BaseModel):
    nickname: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    experience_years: int = 0
    specialties: Optional[str] = None
    hourly_rate: Decimal = Decimal("0")


class HostCreate(HostBase):
    user_id: int


class HostUpdate(BaseModel):
    nickname: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    experience_years: Optional[int] = None
    specialties: Optional[str] = None
    hourly_rate: Optional[Decimal] = None
    is_active: Optional[bool] = None


class HostResponse(HostBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    rating: Decimal
    session_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class HostScheduleBase(BaseModel):
    host_id: int
    date: date
    start_time: time
    end_time: time
    status: str = "available"
    session_id: Optional[int] = None
    notes: Optional[str] = None


class HostScheduleCreate(HostScheduleBase):
    pass


class HostScheduleUpdate(BaseModel):
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    status: Optional[str] = None
    session_id: Optional[int] = None
    notes: Optional[str] = None


class HostScheduleResponse(HostScheduleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
