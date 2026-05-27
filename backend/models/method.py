from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base

class Method(Base):
    __tablename__ = "METHODS"

    id = Column(Integer, primary_key=True)

    name = Column(String, unique=True)

    criterion = relationship(
        "Criterion",
        back_populates="method"
    )