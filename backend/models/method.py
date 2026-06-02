from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base

class Method(Base):
    __tablename__ = "METHODS"

    id = Column(Integer, primary_key=True)

    name = Column(String, nullable=False, unique=True)

    bet = relationship(
        "Bet",
        back_populates="method",
    )