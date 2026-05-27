from pydantic import BaseModel


class UpdateTimelineEvent(BaseModel):
    event: str

    class Config:
        from_attributes = True