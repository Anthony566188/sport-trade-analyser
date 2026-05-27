from pydantic import BaseModel


class MethodRequest(BaseModel):
    name: str

    class Config:
        from_attributes = True