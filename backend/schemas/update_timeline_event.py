from typing import Optional

from pydantic import BaseModel, model_validator

from models.enums.event_type import EventType
from models.timeline_event import TimelineEvent


class UpdateTimelineEvent(BaseModel):
    id_criterion: Optional[int]
    event: Optional[EventType]
    minute_second: int
    additional_minute_second: Optional[int]
    description: Optional[str]
    team: str

    class Config:
        from_attributes = True

    @model_validator(mode='after')
    def validate_time_rules(self) -> 'UpdateTimelineEvent':
        # 'minute_second' não pode ser > 2700 e < 0
        if self.minute_second < 0 or self.minute_second > 2700:
            raise ValueError("'minute_second' deve estar entre 0 e 2700 (45 minutos).")

        # Acréscimo só pode existir se o tempo for exatamente 2700
        if self.additional_minute_second is not None and self.minute_second != 2700:
            raise ValueError(
                "Só é possível passar um valor de acréscimo se o tempo regular ('minute_second') for exatamente 2700.")

        return self

    def to_entity(self) -> TimelineEvent:
        team = self.team.upper().strip() if self.team else None
        if team == "":
            team = None

        return TimelineEvent(
            id_criterion=self.id_criterion,
            event=self.event.value if self.event else None,
            minute_second=self.minute_second,
            additional_minute_second=self.additional_minute_second,
            description=self.description,
            team=team,
        )