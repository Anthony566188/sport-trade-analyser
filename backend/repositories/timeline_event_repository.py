from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.timeline_event import TimelineEvent


def timeline_register(timeline_event: TimelineEvent, db):
    db.add(timeline_event)
    db.commit()
    db.refresh(timeline_event)
    return timeline_event

def update_timeline_event(update_timeline: TimelineEvent, db: Session):
    db.commit()
    db.refresh(update_timeline)
    return update_timeline

def delete_event(timeline_event: TimelineEvent, db: Session):
    db.delete(timeline_event)
    db.commit()
    return {"message": "Timeline_event deleted."}

def get_by_timeline(id_timeline: int, db: Session):
    return (db.query(TimelineEvent)
            .filter(TimelineEvent.id_timeline == id_timeline)
            .order_by(TimelineEvent.minute_second)
            .all())

def get_by_id(id: int, db: Session) -> TimelineEvent:
    timeline_event = db.query(TimelineEvent).filter(TimelineEvent.id == id).first()

    if timeline_event is None:
        raise HTTPException(
            status_code=404,
            detail="TimelineEvent not found."
        )

    return timeline_event