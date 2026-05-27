from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from models.timeline_event import TimelineEvent


# Esse schema define o que a API espera receber no corpo da requisição (JSON)
class TimelineEventRequest(BaseModel):
    id_match: int
    minute: int
    second: int
    event: str
    description: Optional[str] = None

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy

    def to_entity(self) -> TimelineEvent:
        return TimelineEvent(
            id_match = self.id_match,
            minute = self.minute,
            second = self.second,
            event = self.event,
            description = self.description,
        )