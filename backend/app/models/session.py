from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric, Date, Time
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class SessionStatus(str):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    FULL = "full"


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    script_id = Column(Integer, ForeignKey("scripts.id"), nullable=False, index=True)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=False, index=True)
    host_id = Column(Integer, ForeignKey("hosts.id"), nullable=True, index=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    current_players = Column(Integer, default=0)
    min_players = Column(Integer, nullable=False)
    max_players = Column(Integer, nullable=False)
    status = Column(String(20), default="pending")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    script = relationship("Script", back_populates="sessions")
    room = relationship("Room", back_populates="sessions")
    host = relationship("Host", back_populates="sessions")
    bookings = relationship("Booking", back_populates="session")
    host_schedule = relationship("HostSchedule", back_populates="session", uselist=False)
    orders = relationship("Order", back_populates="session")
