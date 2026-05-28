from typing import Optional

from pydantic import BaseModel
from datetime import date

# Esse schema define o que a API espera receber no corpo da requisição (JSON)
class MatchRequest(BaseModel):
    team_home: str
    team_away: str
    championship: str
    date: Optional[date]
    is_neutral_field: bool = False

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy