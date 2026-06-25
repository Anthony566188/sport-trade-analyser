from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

import services.timeline_service as service
from models.enums.match_period import MatchPeriod
from schemas.timeline_request import TimelineRequest

router = APIRouter()

@router.post("/timeline")
def create_timeline(request: TimelineRequest, db: Session = Depends(get_db)):
    try:
        timeline = request.to_entity()
        return service.create(timeline, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/timeline/stop/{id}")
def stop_timeline(id: int,
                  match_period: MatchPeriod,
                  minute_second_finished: int,
                  additional_minute_second_finished: int,
                  db: Session = Depends(get_db)):
    try:
        return service.stop(id, match_period, minute_second_finished, additional_minute_second_finished, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/timeline/match/{id_match}")
def get_by_match(id_match: int, db: Session = Depends(get_db)):
    try:
        return service.get_by_match(id_match, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))