from pydantic import BaseModel, model_validator

from models.enums.match_period import MatchPeriod
from models.timeline import Timeline
from models.value_objects.match_time import check_football_limits


class TimelineRequest(BaseModel):
    id_match: int
    home_goals_initial: int = 0
    away_goals_initial: int = 0
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
        if self.home_goals_initial < 0 or self.away_goals_initial < 0:
            raise ValueError("O placar não deve ter valor negativo")

        return Timeline(
            id_match = self.id_match,
            home_goals = self.home_goals_initial,
            away_goals = self.away_goals_initial,
            match_period_started = self.match_period_started.value,
            minute_second_started = self.minute_second_started,
            additional_minute_second_started = self.additional_minute_second_started,
        )