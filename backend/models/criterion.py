from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship

from database import Base

class Criterion(Base):
    __tablename__ = "CRITERIA"

    id = Column(Integer, primary_key=True)

    title = Column(String, nullable=False, unique=True)

    description = Column(String, nullable=True)

    timeline_event = relationship(
        "TimelineEvent",
        back_populates="criterion"
    )