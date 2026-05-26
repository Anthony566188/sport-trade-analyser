from database import Base
from sqlalchemy import Column, Integer, String

class Match(Base):
    __tablename__ = "MATCHES"

    id = Column(Integer, primary_key=True)

    team_home = Column(String)

    team_away = Column(String)

    championship = Column(String)

    date = Column(String)    