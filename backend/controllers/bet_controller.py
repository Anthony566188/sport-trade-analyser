from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas.bet_exit_request import BetExitRequest
from schemas.bet_request import BetRequest
import services.bet_service as service
from schemas.update_bet_request import UpdateBetRequest

router = APIRouter()

@router.post("/bet")
def create_bet(request: BetRequest, db: Session = Depends(get_db)):
    try:
        bet = request.to_entity()
        return service.create(bet, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/bet/{id}")
def get_by_id(id: int, db: Session = Depends(get_db)):
    return service.get_by_id(id, db)

@router.put("/bet/{id}/exit")
def exit_bet(
    id: int,
    exit_data: BetExitRequest,
    db: Session = Depends(get_db)
):
    try:
        return service.exit(id, exit_data,db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/bet/{id}")
def update_bet(id: int, request: UpdateBetRequest, db: Session = Depends(get_db)):
    updated_bet = request.to_entity()
    try:
        return service.update(id, updated_bet, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/bet/{id}")
def delete_bet(id: int, db: Session = Depends(get_db)):
    return service.delete(id, db)