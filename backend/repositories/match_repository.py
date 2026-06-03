from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.match import Match

def create_match(db, match):
    db.add(match)
    db.commit()
    db.refresh(match)

    return match

def get_matches_by_date(db, date):
    matches = db.query(Match).filter(Match.date == date).all()
    return matches

def update(match: Match, db: Session):
    db.commit()
    db.refresh(match)
    return match

def delete(id: int, db: Session):
    match = db.query(Match).filter(Match.id == id).first()

    if match is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    db.delete(match)
    db.commit()

    return {"message": "Match deleted."}

def get_by_id(id: int, db: Session):
    match = db.query(Match).filter(Match.id == id).first()

    if match is None:
        raise HTTPException(
            status_code=404,
            detail="Match not found."
        )

    return match