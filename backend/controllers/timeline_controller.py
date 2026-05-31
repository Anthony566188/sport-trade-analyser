from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

import services.timeline_service as service
from schemas.timeline_request import TimelineRequest

router = APIRouter()

@router.post("/timeline")
def create_timeline(request: TimelineRequest, db: Session = Depends(get_db)):
    timeline = request.to_entity()
    return service.create(timeline, db)

@router.put("/timeline/stop/{id}")
def stop_timeline(id: int, minute_finished: int, db: Session = Depends(get_db)):
    return service.stop(id, minute_finished, db)