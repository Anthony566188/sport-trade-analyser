from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db

import services.timeline_service as service

router = APIRouter()

@router.get("/timeline/{minute_started}")
def create_timeline(minute_started: int, db: Session = Depends(get_db)):
    return service.create(minute_started, db)