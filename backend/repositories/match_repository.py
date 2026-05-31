from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.match import Match

def create_match(db, match_data):
    match = Match(
        team_home=match_data.team_home,
        team_away=match_data.team_away,
        championship=match_data.championship,
        date=match_data.date,
        is_neutral_field=match_data.is_neutral_field,
        is_friendly=match_data.is_friendly,
    )

    db.add(match)
    db.commit()
    db.refresh(match)

    return match

def get_matches_by_date(db, date):
    matches = db.query(Match).filter(Match.date == date).all()
    return matches

def update(id: int, match_update: Match, db: Session):

    match: Match = db.query(Match).filter(Match.id == id).first()

    if match is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    match.team_home = match_update.team_home
    match.team_away = match_update.team_away
    match.championship = match_update.championship
    match.date = match_update.date
    match.is_neutral_field = match_update.is_neutral_field
    match.is_friendly = match_update.is_friendly

    db.commit()
    db.refresh(match)

    return match

def get_by_id(id: int, db: Session) -> Match:
    return db.query(Match).filter(Match.id == id).first()

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