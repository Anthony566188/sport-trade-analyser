from typing import Optional

from pydantic import BaseModel

from models.criterion import Criterion


# Esse schema define o que a API espera receber no corpo da requisição (JSON)
class CriterionRequest(BaseModel):
    id_method: int
    title: str
    description: Optional[str] = None

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy

    def to_entity(self) -> Criterion:
        return Criterion(
            id_method=self.id_method,
            title=self.title,
            description=self.description
        )