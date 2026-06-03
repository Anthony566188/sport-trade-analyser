from sqlalchemy.orm import relationship

from database import Base
from sqlalchemy import Column, Integer, String

class Match(Base):
    __tablename__ = "MATCHES"

    id = Column(Integer, primary_key=True)

    team_home = Column(String, nullable=False)

    team_away = Column(String, nullable=False)

    home_goals = Column(Integer, nullable=False)

    away_goals = Column(Integer, nullable=False)

    championship = Column(String)

    date = Column(String, nullable=False)

    is_neutral_field = Column(Integer, nullable=False)

    is_friendly = Column(Integer, nullable=False)

    timeline = relationship(
        "Timeline",
        back_populates="match",
        uselist=False, # relacionamento 1 para 1
        cascade="all, delete-orphan", 
    )