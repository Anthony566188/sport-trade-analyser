from typing import Optional

from pydantic import BaseModel
from datetime import date

from models.match import Match


class MatchRequest(BaseModel):
    team_home: str
    team_away: str
    home_goals: int = 0
    away_goals: int = 0
    championship: Optional[str]
    date: Optional[date]
    is_neutral_field: bool = False
    is_friendly: bool = False

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy

    def to_entity(self) -> Match:
        championship = self.championship.upper().strip() if self.championship else None
        if championship == "":
            championship = None

        return Match(
            team_home=self.team_home.upper().strip(),
            team_away=self.team_away.upper().strip(),
            home_goals=self.home_goals,
            away_goals=self.away_goals,
            championship=championship,
            date=self.date,
            is_neutral_field=self.is_neutral_field,
            is_friendly=self.is_friendly,
        )