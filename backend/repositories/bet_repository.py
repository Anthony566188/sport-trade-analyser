from fastapi import HTTPException

from sqlalchemy.orm import Session

from models.bet import Bet
from models.method import Method


def create(bet_data: Bet, db: Session):

    method_exists = db.query(Method).filter(Method.id == bet_data.id_method).first()

    if method_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Method not found"
        )

    bet = Bet(
        id_method = bet_data.id_method,
        stake = bet_data.stake,
        entry_odd = bet_data.entry_odd,
        type= bet_data.type,
        date= bet_data.date,
    )

    db.add(bet)
    db.commit()
    db.refresh(bet)

    return bet


def get_by_id(id: int, db: Session):

    bet_exists = db.query(Bet).filter(Bet.id == id).first()

    if bet_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Bet not found"
        )

    return bet_exists


def exit_bet(id: int, bet: Bet, db: Session):

    db.commit()
    db.refresh(bet)

    return {"message": f"Bet id {id} encerrada!"}