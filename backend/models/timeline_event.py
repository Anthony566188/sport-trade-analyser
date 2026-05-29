from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

class TimelineEvent(Base):
    __tablename__ = "TIMELINE_EVENTS"

    id = Column(Integer, primary_key=True)

    id_match = Column(Integer, ForeignKey('MATCHES.id'))

    match = relationship("Match", back_populates="timeline_event")

    id_event = Column(Integer, ForeignKey('EVENTS.id'))

    event = relationship("Event", back_populates="timeline_event")

    id_criterion = Column(Integer, ForeignKey('CRITERIA.id'))

    criterion = relationship("Criterion", back_populates="timeline_event")

    id_timeline = Column(Integer, ForeignKey('TIMELINES.id'))

    timeline = relationship("Timeline", back_populates="timeline_event")

    minute = Column(Integer, nullable=False)

    second = Column(Integer, nullable=False)

    description = Column(String, nullable=True)

    team = Column(String, nullable=True)