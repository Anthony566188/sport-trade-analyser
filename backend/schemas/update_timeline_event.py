from typing import Optional

from pydantic import BaseModel

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