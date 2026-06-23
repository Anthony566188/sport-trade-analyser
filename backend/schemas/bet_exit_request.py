from decimal import Decimal

from pydantic import BaseModel, model_validator

from models.enums.match_period import MatchPeriod
from models.value_objects.match_time import check_football_limits


class BetExitRequest(BaseModel):
    exit_odd: Decimal
    exit_period: MatchPeriod
    exit_minute_second: int
    exit_additional_minute_second: int = 0

    class Config:
        from_attributes = True

    @model_validator(mode='after')
    def validate_time(self):
        try:
            check_football_limits(self.exit_period.value, self.exit_minute_second, self.exit_additional_minute_second)
        except ValueError as e:
            raise ValueError(str(e))
        return self