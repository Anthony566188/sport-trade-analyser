from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.criterion import Criterion
from models.timeline import Timeline
from models.timeline_event import TimelineEvent

import repositories.bet_repository as bet_repository
import repositories.criterion_repository as criterion_repository


def timeline_register(timeline_event_data: TimelineEvent, db):

    # Se for passado um 'criterio', verifica se ele existe
    if timeline_event_data.id_criterion != None:
        criterion_repository.get_by_id(timeline_event_data.id_criterion, db)

    # Se for passado uma 'bet', verifica se ela existe
    if timeline_event_data.id_bet != None:
        bet_repository.get_by_id(timeline_event_data.id_bet, db)

    # Verifica se a 'timeline' existe
    timeline_exists = (
        db.query(Timeline.id)
        .filter(Timeline.id == timeline_event_data.id_timeline)
        .first()
    )

    if timeline_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Timeline not found."
        )

    timeline_event = TimelineEvent(
        id_criterion=timeline_event_data.id_criterion,
        id_timeline=timeline_event_data.id_timeline,
        id_bet=timeline_event_data.id_bet,
        event=timeline_event_data.event,
        minute=timeline_event_data.minute,
        second=timeline_event_data.second,
        additional_minute=timeline_event_data.additional_minute,
        description=timeline_event_data.description,
        team=timeline_event_data.team,
    )

    db.add(timeline_event)
    db.commit()
    db.refresh(timeline_event)

    return timeline_event

def update_timeline_event(id: int, update_timeline: TimelineEvent, db: Session):

    timeline_event: TimelineEvent = db.query(TimelineEvent).filter(TimelineEvent.id == id).first()

    if timeline_event is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    if update_timeline.id_criterion != None:
        criterion_existis: TimelineEvent = db.query(Criterion).filter(Criterion.id == update_timeline.id_criterion).first()
        if criterion_existis is None:
            raise HTTPException(
                status_code=404,
                detail="Criterion not found."
            )

    timeline_event.id_criterion = update_timeline.id_criterion
    timeline_event.event = update_timeline.event
    timeline_event.minute = update_timeline.minute
    timeline_event.second = update_timeline.second
    timeline_event.additional_minute = update_timeline.additional_minute
    timeline_event.description = update_timeline.description
    timeline_event.team = update_timeline.team

    db.commit()
    db.refresh(timeline_event)

    return timeline_event

def delete_event(id: int, db: Session):
    timeline_event = db.query(TimelineEvent).filter(TimelineEvent.id == id)\
        .first()

    if timeline_event is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    db.delete(timeline_event)

    db.commit()

    return {"message": "Timeline_event deleted."}


def get_by_timeline(id_timeline: int, db: Session):

    timeline_exists = db.query(Timeline).filter(Timeline.id == id_timeline).first()

    if timeline_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Timeline not found."
        )

    return (db.query(TimelineEvent)
            .filter(TimelineEvent.id_timeline == id_timeline)
            .order_by(TimelineEvent.minute, TimelineEvent.second)
            .all())