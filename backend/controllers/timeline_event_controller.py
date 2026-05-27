from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

import services.timeline_event_service as service

from schemas.timeline_event_request import TimelineEventRequest

router = APIRouter()

@router.post("/timeline")
def register(timeline: TimelineEventRequest, db: Session = Depends(get_db)):
    return service.timeline_register(timeline, db)
