from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.match_request import MatchRequest
import services.match_service as service
from datetime import date

router = APIRouter()

@router.post("/matches")
def create(request: MatchRequest, db: Session = Depends(get_db)):
    match = request.to_entity()
    return service.register_match(db, match)

@router.get("/matches/date/{date}")
def get_matches_by_date(date: date, db: Session = Depends(get_db)):
    return service.get_matches_by_date(db, date)

@router.put("/matches/{id}")
def update_match(id: int, request: MatchRequest, db: Session = Depends(get_db)):
    match = request.to_entity()
    return service.update_match(id, match, db)