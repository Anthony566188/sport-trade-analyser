from sqlalchemy.orm import relationship

from database import Base
from sqlalchemy import Column, Integer, String

class Match(Base):
    __tablename__ = "MATCHES"

    id = Column(Integer, primary_key=True)

    team_home = Column(String, nullable=False)

    team_away = Column(String, nullable=False)

    championship = Column(String)

    date = Column(String, nullable=False)

    is_neutral_field = Column(Integer, nullable=False)

    timeline_event = relationship(
        "TimelineEvent",
        back_populates="match"
    )