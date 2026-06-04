from pydantic import BaseModel

from models.timeline import Timeline


class TimelineRequest(BaseModel):
    id_match: int
    minute_second_started: int

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy

    def to_entity(self) -> Timeline:
        return Timeline(
            id_match = self.id_match,
            minute_second_started = self.minute_second_started,
        )