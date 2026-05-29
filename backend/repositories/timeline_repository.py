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