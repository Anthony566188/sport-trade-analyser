from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database  import Base

class Timeline(Base):
    __tablename__ = 'TIMELINES'

    id = Column(Integer, primary_key=True)

    minute_started = Column(Integer, nullable=False)

    minute_finished = Column(Integer)

    timeline_event = relationship(
        "TimelineEvent",
        back_populates="timeline"
    )