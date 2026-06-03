from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal

from database import get_db
from schemas.bet_request import BetRequest
import services.bet_service as service
from schemas.update_bet_request import UpdateBetRequest

router = APIRouter()

@router.post("/bet")
def create_bet(request: BetRequest, db: Session = Depends(get_db)):
    bet = request.to_entity()
    return service.create(bet, db)

@router.get("/bet/{id}")
def get_by_id(id: int, db: Session = Depends(get_db)):
    return service.get_by_id(id, db)

@router.put("/bet/{id}/exit/{exit_odd}")
def exit_bet(id: int, exit_odd: Decimal, db: Session = Depends(get_db)):
    return service.exit(id, exit_odd, db)

@router.put("/bet/{id}")
def update_bet(id: int, request: UpdateBetRequest, db: Session = Depends(get_db)):
    updated_bet = request.to_entity()
    try:
        return service.update(id, updated_bet, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))