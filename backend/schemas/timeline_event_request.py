from pydantic import BaseModel

# Esse schema define o que a API espera receber no corpo da requisição (JSON)
class TimelineEventRequest(BaseModel):
    minute: int
    event: str
    id_match: int

    class Config:
        from_attributes = True # Permite a integração com o SQLAlchemy