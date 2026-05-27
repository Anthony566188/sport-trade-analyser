from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

import services.timeline_event_service as service

from schemas.timeline_event_request import TimelineEventRequest
from schemas.update_timeline_event import UpdateTimelineEvent

router = APIRouter()

@router.post("/timeline")
def register(timeline: TimelineEventRequest, db: Session = Depends(get_db)):
    return service.timeline_register(timeline, db)

@router.put("/timeline/{id}")
def update_event(id: int, update_event: UpdateTimelineEvent, db: Session = Depends(get_db)):
    return service.update_event(id, update_event, db)

@router.delete("/timeline/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    return service.delete_event(id, db)