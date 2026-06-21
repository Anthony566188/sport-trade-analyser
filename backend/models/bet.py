from sqlalchemy import Column, Integer, Numeric, String, ForeignKey
from sqlalchemy.orm import relationship

from database import Base

class Bet(Base):
    __tablename__ = "BETS"

    id = Column(Integer, primary_key=True)

    id_method = Column(Integer, ForeignKey('METHODS.id'))

    method = relationship("Method", back_populates="bet")

    stake = Column(Numeric, nullable=False)

    entry_odd = Column(Numeric, nullable=False)

    type = Column(String, nullable=False)

    exit_odd = Column(Numeric, nullable=True)

    date = Column(String, nullable=False)

    entry_period = Column(String, nullable=False)

    entry_minute_second = Column(Integer, nullable=False)

    entry_additional_minute_second = Column(Integer, nullable=True)

    exit_period = Column(String, nullable=True)

    exit_minute_second = Column(Integer, nullable=True)

    exit_additional_minute_second = Column(Integer, nullable=True)

