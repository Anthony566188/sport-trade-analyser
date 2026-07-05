from typing import Optional
from pydantic import BaseModel

class FrequentSelectionResponse(BaseModel):
    id_criterion: Optional[int] = None
    title: Optional[str] = None
    event: Optional[str] = None

    class Config:
        from_attributes = True