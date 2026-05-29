from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base

class Event(Base):
    __tablename__ = "EVENTS"

    id = Column(Integer, primary_key=True)

    name = Column(String, nullable=False, unique=True)

    timeline_event = relationship(
        "TimelineEvent",
        back_populates="event"
    )