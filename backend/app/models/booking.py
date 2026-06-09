from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class BookingStatus(str):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    WAITLIST = "waitlist"


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    player_count = Column(Integer, default=1)
    character_name = Column(String(100))
    status = Column(String(20), default="pending")
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    session = relationship("Session", back_populates="bookings")
    player = relationship("User", back_populates="bookings")
