from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database  import Base

class Timeline(Base):
    __tablename__ = 'TIMELINES'

    id = Column(Integer, primary_key=True)

    id_match = Column(Integer, ForeignKey('MATCHES.id'), unique=True)

    match = relationship("Match", back_populates="timeline")

    minute_started = Column(Integer, nullable=False)

    minute_finished = Column(Integer)

    timeline_event = relationship(
        "TimelineEvent",
        back_populates="timeline",
        cascade="all, delete-orphan",
    )