from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.match_request import MatchRequest
import services.match_service as service

router = APIRouter()

@router.post("/matches")
def create(match: MatchRequest, db: Session = Depends(get_db)):
    return service.register_match(db, match)