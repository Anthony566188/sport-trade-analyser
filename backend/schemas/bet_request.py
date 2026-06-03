from pydantic import BaseModel
from decimal import Decimal
from models.bet import Bet
from models.enums.bet_type import BetType


class BetRequest(BaseModel):
    id_method: int
    stake: Decimal
    entry_odd: Decimal
    type: BetType

    class Config:
        from_attributes = True

    def to_entity(self) -> Bet:
        return Bet(
            id_method = self.id_method,
            stake = self.stake,
            entry_odd = self.entry_odd,
            type = self.type.value,
        )