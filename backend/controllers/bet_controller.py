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

@router.get("/bet/{id}")
def get_by_id(id: int, db: Session = Depends(get_db)):
    return service.get_by_id(id, db)

@router.put("/bet/{id}/exit/{exit_odd}")
def exit_bet(id: int, exit_odd: float, db: Session = Depends(get_db)):
    return service.exit(id, exit_odd, db)