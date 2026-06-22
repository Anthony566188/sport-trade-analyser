from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship

from database import Base

class TimelineEvent(Base):
    __tablename__ = "TIMELINE_EVENTS"

    id = Column(Integer, primary_key=True)

    id_criterion = Column(Integer, ForeignKey('CRITERIA.id'))

    criterion = relationship("Criterion", back_populates="timeline_event")

    id_timeline = Column(Integer, ForeignKey('TIMELINES.id'))

    timeline = relationship("Timeline", back_populates="timeline_event")

    event = Column(String, nullable=True)

    match_period = Column(String, nullable=False)

    minute_second = Column(Integer, nullable=False)

    additional_minute_second = Column(Integer, nullable=True)

    team = Column(String, nullable=False)

    __table_args__ = (

        UniqueConstraint(
            "id_timeline",
            "minute_second",
            "additional_minute_second",
            "match_period",
            name="TIMELINE_EVENTS_UNIQUE_TIME_UN"
        ),
        Index(
            "ux_timeline_minute_null",
            "id_timeline",
            "minute_second",
            unique=True,
            sqlite_where=(additional_minute_second.is_(None))
        )
    )