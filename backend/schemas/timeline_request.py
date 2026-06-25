from pydantic import BaseModel, model_validator

from models.enums.match_period import MatchPeriod
from models.timeline import Timeline
from models.value_objects.match_time import check_football_limits


class TimelineRequest(BaseModel):
    id_match: int
    match_period_started: MatchPeriod
    minute_second_started: int
    additional_minute_second_started: int = 0

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy

    @model_validator(mode='after')
    def validate_time(self):
        try:
            check_football_limits(self.match_period_started.value, self.minute_second_started, self.additional_minute_second_started)
        except ValueError as e:
            raise ValueError(str(e))
        return self

    def to_entity(self) -> Timeline:
        return Timeline(
            id_match = self.id_match,
            match_period_started = self.match_period_started.value,
            minute_second_started = self.minute_second_started,
            additional_minute_second_started = self.additional_minute_second_started,
        )