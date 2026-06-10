from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class Host(Base):
    __tablename__ = "hosts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    nickname = Column(String(100), nullable=False)
    bio = Column(Text)
    avatar = Column(String(255))
    experience_years = Column(Integer, default=0)
    specialties = Column(String(500))
    rating = Column(Numeric(3, 2), default=5.0)
    session_count = Column(Integer, default=0)
    hourly_rate = Column(Numeric(10, 2), default=0)
    accept_type = Column(String(50), default="all")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="host_profile")
    schedules = relationship("HostSchedule", back_populates="host")
    sessions = relationship("Session", back_populates="host")
