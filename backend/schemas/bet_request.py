from pydantic import BaseModel

from models.bet import Bet
from models.enums.bet_type import BetType


class BetRequest(BaseModel):
    id_method: int
    entry_odd: float
    type: BetType

    class Config:
        from_attributes = True

    def to_entity(self) -> Bet:
        return Bet(
            id_method = self.id_method,
            entry_odd = self.entry_odd,
            type = self.type.value,
        )