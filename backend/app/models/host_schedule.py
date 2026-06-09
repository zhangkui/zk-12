from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base


class HostSchedule(Base):
    __tablename__ = "host_schedules"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("hosts.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(String(20), default="available")
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    notes = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    host = relationship("Host", back_populates="schedules")
    session = relationship("Session", back_populates="host_schedule")
