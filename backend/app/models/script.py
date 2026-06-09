from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Numeric, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..core.database import Base


class ScriptDifficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ScriptType(str, enum.Enum):
    SUSPENSE = "suspense"
    EMOTION = "emotion"
    HORROR = "horror"
    HAPPY = "happy"
    MECHANISM = "mechanism"
    OTHER = "other"


class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    author = Column(String(100))
    publisher = Column(String(100))
    description = Column(Text)
    difficulty = Column(Enum(ScriptDifficulty), default=ScriptDifficulty.MEDIUM)
    script_type = Column(Enum(ScriptType), default=ScriptType.OTHER)
    min_players = Column(Integer, nullable=False)
    max_players = Column(Integer, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    cover_image = Column(String(255))
    images = Column(String(1000))
    tags = Column(String(200))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sessions = relationship("Session", back_populates="script")
