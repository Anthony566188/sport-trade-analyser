from sqlalchemy import Column, Integer, String

from database import Base

class TimelineEvent(Base):
    __tablename__ = "TIMELINE_EVENTS"

    id = Column(Integer, primary_key=True)

    minute = Column(Integer)

    event = Column(String)