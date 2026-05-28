from sqlalchemy import Column, Integer, ForeignKey, String

from database import Base

class Criterion(Base):
    __tablename__ = "CRITERIA"

    id = Column(Integer, primary_key=True)

    title = Column(String, nullable=False, unique=True)

    description = Column(String, nullable=True)