from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database  import Base

class Timeline(Base):
    __tablename__ = 'TIMELINES'

    id = Column(Integer, primary_key=True)

    id_match = Column(Integer, ForeignKey('MATCHES.id'), unique=True)

    match = relationship("Match", back_populates="timeline")

    match_period_started = Column(String, nullable=False)

    minute_second_started = Column(Integer, nullable=False)

    additional_minute_second_started = Column(Integer, nullable=True)

    match_period_finished = Column(String, nullable=True)

    minute_second_finished = Column(Integer, nullable=True)

    additional_minute_second_finished = Column(Integer, nullable=True)

    timeline_event = relationship(
        "TimelineEvent",
        back_populates="timeline",
        cascade="all, delete-orphan",
    )