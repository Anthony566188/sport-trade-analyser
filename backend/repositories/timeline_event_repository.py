from fastapi import HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from db_utils import handle_db_constraints
from models.timeline_event import TimelineEvent
from models.enums.match_period import PERIOD_ORDER

def timeline_register(timeline_event: TimelineEvent, db):
    db.add(timeline_event)
    with handle_db_constraints(db):
        db.commit()
        db.refresh(timeline_event)
    return timeline_event


def update_timeline_event(update_timeline: TimelineEvent, db: Session):
    with handle_db_constraints(db):
        db.commit()
        db.refresh(update_timeline)
    return update_timeline


def delete_event(timeline_event: TimelineEvent, db: Session):
    db.delete(timeline_event)
    db.commit()
    return {"message": "Timeline_event deleted."}


def get_by_timeline(id_timeline: int, db: Session):
    sql_wording_weights = {period.value: weight for period, weight in PERIOD_ORDER.items()}

    period_sort_logic = case(
        sql_wording_weights,
        value=TimelineEvent.match_period,
        else_=0 # Fallback caso apareça algum valor inesperado
    )

    return (db.query(TimelineEvent)
                .filter(TimelineEvent.id_timeline == id_timeline)
                .order_by(
                    period_sort_logic.desc(),
                    TimelineEvent.minute_second.desc(),
                    # Se for null retorna 0
                    func.coalesce(TimelineEvent.additional_minute_second, 0).desc()
                ).all()
            )


def get_by_id(id: int, db: Session) -> TimelineEvent:
    timeline_event = db.query(TimelineEvent).filter(TimelineEvent.id == id).first()

    if timeline_event is None:
        raise HTTPException(
            status_code=404,
            detail="TimelineEvent not found."
        )

    return timeline_event