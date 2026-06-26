from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.timeline import Timeline

def create(timeline: Timeline, db: Session):
    db.add(timeline)
    db.commit()
    db.refresh(timeline)
    return timeline

def stop(timeline: Timeline, db: Session):
    db.commit()
    db.refresh(timeline)
    return {"message": "Timeline stopped."}

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

def get_by_match(id_match: int, db: Session) -> Timeline:
    timeline = db.query(Timeline).filter(Timeline.id_match == id_match).first()
    if timeline is None:
        raise ValueError(f"Não existe uma timeline com id_match = {id_match}")
    return timeline

def get_by_id(id: int, db: Session) -> Timeline:
    timeline = db.query(Timeline).filter(Timeline.id == id).first()

    if timeline is None:
        raise HTTPException(
            status_code=404,
            detail="Timeline not found."
        )

    return timeline

def has_null_in_minute_second_finished(db: Session):
    record_with_null = (
        db.query(Timeline)
        .filter(Timeline.minute_second_finished.is_(None))
        .first()
    )

    if record_with_null:
        raise ValueError("Já existe um registro com MINUTE_SECOND_FINISHED = NULL, encerre-o primeiro!")