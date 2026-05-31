from typing import Optional

from pydantic import BaseModel

from models.enums.event_type import EventType
from models.timeline_event import TimelineEvent

class TimelineEventRequest(BaseModel):
    id_criterion: int
    id_timeline: int
    event: EventType
    minute: int
    second: int
    description: Optional[str] = None
    team: str

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy

    def to_entity(self) -> TimelineEvent:
        return TimelineEvent(
            id_criterion = self.id_criterion,
            id_timeline = self.id_timeline,
            event = self.event,
            minute = self.minute,
            second = self.second,
            description = self.description,
            team=self.team
        )