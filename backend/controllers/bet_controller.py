from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.bet_request import BetRequest
import services.bet_service as service

router = APIRouter()

@router.post("/bet")
def create_bet(request: BetRequest, db: Session = Depends(get_db)):
    bet = request.to_entity()
    return service.create(bet, db)