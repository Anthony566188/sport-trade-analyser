from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

import services.timeline_event_service as service

from schemas.timeline_event_request import TimelineEventRequest
from schemas.update_timeline_event import UpdateTimelineEvent

router = APIRouter()

@router.post("/timeline-event")
def register(request: TimelineEventRequest, db: Session = Depends(get_db)):
    try:
        timeline = request.to_entity()
        return service.timeline_register(timeline, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/timeline-event/{id}")
def update_timeline_event(id: int, update: UpdateTimelineEvent, db: Session = Depends(get_db)):
    try:
        update_timeline_event = update.to_entity()
        return service.update_timeline_event(id, update_timeline_event, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/timeline-event/{id}")
def delete(id: int, db: Session = Depends(get_db)):
    return service.delete_event(id, db)

@router.get("/timeline-event/timeline/{id_timeline}")
def get_by_timeline(id_timeline: int, db: Session = Depends(get_db)):
    return service.get_by_timeline(id_timeline, db)