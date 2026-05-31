from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.match import Match
from models.timeline import Timeline


def create(timeline: Timeline, db: Session):

    match_exists = (
        db.query(Match.id)
        .filter(Match.id == timeline.id_match)
        .first()
    )

    if match_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Method not found."
        )

    timeline = Timeline(
        id_match=timeline.id_match,
        minute_started=timeline.minute_started
    )

    db.add(timeline)
    db.commit()
    db.refresh(timeline)

    return timeline

def stop(id: int, minute_finished: int, db: Session):
    timeline = db.query(Timeline).filter(Timeline.id == id)\
        .first()

    if timeline is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    timeline.minute_finished = minute_finished

    db.commit()
    db.refresh(timeline)

    return {"message": f"Timeline id {id} Stopped"}

def delete(id: int, db: Session):
    timeline = db.query(Timeline).filter(Timeline.id == id) \
        .first()

    if timeline is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    db.delete(timeline)

    db.commit()

    return {"message": "Timeline deleted."}