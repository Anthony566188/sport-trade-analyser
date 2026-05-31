from typing import Optional

from pydantic import BaseModel
from datetime import date

from models.match import Match


class MatchRequest(BaseModel):
    team_home: str
    team_away: str
    championship: str
    date: Optional[date]
    is_neutral_field: bool = False

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy

    def to_entity(self) -> Match:
        return Match(
            team_home=self.team_home.upper(),
            team_away=self.team_away.upper(),
            championship=self.championship.upper(),
            date=self.date,
            is_neutral_field=self.is_neutral_field
        )