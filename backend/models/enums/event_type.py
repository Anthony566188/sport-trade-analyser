from enum import Enum

class EventType(Enum):
    YELLOW_CARD = "YELLOW_CARD"
    RED_CARD = "RED_CARD"
    GOAL = "GOAL"
    CORNER = "CORNER"
    FOUL_NEAR_THE_AREA = "FOUL_NEAR_THE_AREA"
    FOUL = "FOUL"
