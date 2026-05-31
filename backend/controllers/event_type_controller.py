from fastapi import APIRouter

from models.enums.event_type import EventType

router = APIRouter()

@router.get("/event-type")
def get_event_type():
    events = []
    for e in EventType:
        events.append(e)

    return events