from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

class TimelineEvent(Base):
    __tablename__ = "TIMELINE_EVENTS"

    id = Column(Integer, primary_key=True)

    id_match = Column(Integer, ForeignKey('MATCHES.id'))

    match = relationship("Match", back_populates="timeline_events")

    minute = Column(Integer, nullable=False)

    second = Column(Integer, nullable=False)

    event = Column(String, nullable=False)

    description = Column(String, nullable=True)

    created_at = Column(String, nullable=False)