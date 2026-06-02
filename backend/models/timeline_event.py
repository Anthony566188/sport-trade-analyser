from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

class TimelineEvent(Base):
    __tablename__ = "TIMELINE_EVENTS"

    id = Column(Integer, primary_key=True)

    id_criterion = Column(Integer, ForeignKey('CRITERIA.id'))

    criterion = relationship("Criterion", back_populates="timeline_event")

    id_timeline = Column(Integer, ForeignKey('TIMELINES.id'))

    timeline = relationship("Timeline", back_populates="timeline_event")

    id_bet = Column(Integer, ForeignKey('BETS.id'))

    bet = relationship("Bet", back_populates="timeline_event")

    event = Column(String, nullable=True, unique=True)

    minute = Column(Integer, nullable=False)

    second = Column(Integer, nullable=False)

    additional_minute = Column(Integer, nullable=True)

    description = Column(String, nullable=True)

    team = Column(String, nullable=False)