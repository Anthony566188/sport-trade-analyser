from fastapi import HTTPException
from sqlalchemy.orm import Session

from db_utils import handle_db_constraints
from models.bet import Bet

import repositories.match_repository as match_repository

def create(bet: Bet, db: Session):
    db.add(bet)
    with handle_db_constraints(db):
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


def update(bet: Bet, db: Session):
    with handle_db_constraints(db):
        db.commit()
        db.refresh(bet)
    return bet

def delete(bet, db: Session):
    db.delete(bet)
    db.commit()
    return {"message": "Bet deleted."}

def get_by_match(id_match: int, db: Session):
    match_repository.get_by_id(id_match, db)
    return db.query(Bet).filter(Bet.id_match == id_match).all()