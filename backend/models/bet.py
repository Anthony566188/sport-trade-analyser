from sqlalchemy import Column, Integer, Numeric, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

class Bet(Base):
    __tablename__ = "BETS"

    id = Column(Integer, primary_key=True)

    id_method = Column(Integer, ForeignKey('METHODS.id'))

    method = relationship("Method", back_populates="bet")

    entry_odd = Column(Numeric, nullable=False)

    type = Column(String, nullable=False)

    exit_odd = Column(Numeric, nullable=True)

    date = Column(String, nullable=False)

    timeline_event = relationship(
        "TimelineEvent",
        back_populates="bet",
    )