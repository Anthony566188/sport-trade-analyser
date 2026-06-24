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

    def has_championship(self) -> bool:
        if self.championship is None:
            return False
        return str(self.championship).strip() != ""

    def is_friendly_match(self) -> bool:
        return bool(self.is_friendly)

    def validate_friendly_championship(self) -> None:
        has_championship = self.has_championship()
        is_friendly = self.is_friendly_match()

        if is_friendly and has_championship:
            raise ValueError(
                "Partida amistosa não pode ter campeonato."
            )

        if not is_friendly and not has_championship:
            raise ValueError(
                "Partida não amistosa deve informar o campeonato."
            )

    timeline = relationship(
        "Timeline",
        back_populates="match",
        uselist=False, # relacionamento 1 para 1
        cascade="all, delete-orphan", 
    )

    bet = relationship(
        "Bet",
        back_populates="match",
        cascade="all, delete-orphan",
    )