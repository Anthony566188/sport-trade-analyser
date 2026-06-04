from typing import Optional

from pydantic import BaseModel

from models.enums.event_type import EventType
from models.timeline_event import TimelineEvent

class TimelineEventRequest(BaseModel):
    id_criterion: Optional[int]
    id_timeline: int
    id_bet: Optional[int]
    event: Optional[EventType]
    minute_second: int
    additional_minute_second: Optional[int]
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
            minute_second = self.minute_second,
            additional_minute_second = self.additional_minute_second,
            description = self.description,
            team=self.team.upper().strip()
        )