from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..core.database import Base


class UserRole(str, enum.Enum):
    PLAYER = "player"
    HOST = "host"
    ADMIN = "admin"
    OWNER = "owner"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    hashed_payment_password = Column(String(255))
    full_name = Column(String(100))
    avatar = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.PLAYER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    host_profile = relationship("Host", back_populates="user", uselist=False)
    bookings = relationship("Booking", back_populates="player")
    orders = relationship("Order", back_populates="user")
    balance = relationship("UserBalance", back_populates="user", uselist=False)
    recharge_orders = relationship("RechargeOrder", foreign_keys="RechargeOrder.user_id", back_populates="user")
    transactions = relationship("TransactionRecord", back_populates="user")
