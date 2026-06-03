from typing import Optional

from pydantic import BaseModel

from models.enums.event_type import EventType
from models.timeline_event import TimelineEvent

class TimelineEventRequest(BaseModel):
    id_criterion: Optional[int]
    id_timeline: int
    id_bet: Optional[int]
    event: Optional[EventType]
    minute: int
    second: int
    additional_minute: Optional[int]
    description: Optional[str] = None
    team: str

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy

    def to_entity(self) -> TimelineEvent:
        return TimelineEvent(
            id_criterion = self.id_criterion,
            id_timeline = self.id_timeline,
            id_bet = self.id_bet,
            event = self.event.value if self.event else None,
            minute = self.minute,
            second = self.second,
            additional_minute = self.additional_minute,
            description = self.description,
            team=self.team.upper().strip()
        )