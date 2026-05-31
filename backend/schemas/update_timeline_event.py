from typing import Optional

from pydantic import BaseModel

from models.enums.event_type import EventType
from models.timeline_event import TimelineEvent


class UpdateTimelineEvent(BaseModel):
    id_criterion: Optional[int]
    event: Optional[EventType]
    minute: int
    second: int
    description: Optional[str]
    team: str

    class Config:
        from_attributes = True

    def to_entity(self) -> TimelineEvent:
        return TimelineEvent(
            id_criterion=self.id_criterion,
            event=self.event.value if self.event else None,
            minute=self.minute,
            second=self.second,
            description=self.description,
            team=self.team
        )