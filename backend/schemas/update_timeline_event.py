from typing import Optional

from pydantic import BaseModel, model_validator

from models.enums.event_type import EventType
from models.enums.match_period import MatchPeriod
from models.timeline_event import TimelineEvent
from models.value_objects.match_time import check_football_limits


class UpdateTimelineEvent(BaseModel):
    id_criterion: Optional[int]
    event: Optional[EventType]
    match_period: MatchPeriod
    minute_second: int
    additional_minute_second: int = 0
    team: str

    class Config:
        from_attributes = True

    @model_validator(mode='after')
    def validate_time(self):
        try:
            check_football_limits(self.match_period.value, self.minute_second, self.additional_minute_second)
        except ValueError as e:
            raise ValueError(str(e))
        return self

    def to_entity(self) -> TimelineEvent:
        team = self.team.upper().strip() if self.team else None
        if team == "":
            team = None

        return TimelineEvent(
            id_criterion=self.id_criterion,
            event=self.event.value if self.event else None,
            match_period=self.match_period,
            minute_second=self.minute_second,
            additional_minute_second=self.additional_minute_second,
            team=team,
        )