from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

import services.timeline_service as service

router = APIRouter()

@router.post("/timeline/start/{minute_started}")
def create_timeline(minute_started: int, db: Session = Depends(get_db)):
    return service.create(minute_started, db)

@router.put("/timeline/stop/{id}")
def stop_timeline(id: int, minute_finished: int, db: Session = Depends(get_db)):
    return service.stop(id, minute_finished, db)