from pydantic import BaseModel, model_validator
from decimal import Decimal
from models.bet import Bet
from models.enums.bet_type import BetType
from models.enums.match_period import MatchPeriod
from models.value_objects.match_time import check_football_limits


class BetRequest(BaseModel):
    id_method: int
    id_match: int
    stake: Decimal
    entry_odd: Decimal
    type: BetType
    entry_period: MatchPeriod
    entry_minute_second: int
    entry_additional_minute_second: int = 0

    class Config:
        from_attributes = True

    @model_validator(mode='after')
    def validate_time(self):
        try:
            check_football_limits(self.entry_period.value, self.entry_minute_second, self.entry_additional_minute_second)
        except ValueError as e:
            raise ValueError(str(e))
        return self

    def to_entity(self) -> Bet:
        return Bet(
            id_method = self.id_method,
            id_match = self.id_match,
            stake = self.stake,
            entry_odd = self.entry_odd,
            type = self.type.value,
            entry_period = self.entry_period.value,
            entry_minute_second = self.entry_minute_second,
            entry_additional_minute_second = self.entry_additional_minute_second,
        )