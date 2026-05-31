from typing import Optional

from pydantic import BaseModel

from models.criterion import Criterion

class CriterionRequest(BaseModel):
    title: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

    def to_entity(self) -> Criterion:
        return Criterion(
            title=self.title.strip(),
            description=self.description.strip() if self.description else None,
        )