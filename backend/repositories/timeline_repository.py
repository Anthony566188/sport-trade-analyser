from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.timeline import Timeline


def create(minute_started: int, db: Session):
    timeline = Timeline(
        minute_started=minute_started
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

    return {"message": f"Timeline de {id} Stopped"}