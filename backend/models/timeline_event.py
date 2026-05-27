from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

class TimelineEvent(Base):
    __tablename__ = "TIMELINE_EVENTS"

    id = Column(Integer, primary_key=True)

    minute = Column(Integer)

    event = Column(String)

    id_match = Column(Integer, ForeignKey('MATCHES.id'))

    match = relationship("Match", back_populates="timeline_events")