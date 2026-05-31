from fastapi import HTTPException

from models.criterion import Criterion
from models.timeline import Timeline
from models.timeline_event import TimelineEvent


def timeline_register(timeline_event_data: TimelineEvent, db):

    if timeline_event_data.id_criterion != None:
        criterion_exists = (
            db.query(Criterion.id)
            .filter(Criterion.id == timeline_event_data.id_criterion)
            .first()
        )

        if criterion_exists is None:
            raise HTTPException(
                status_code=404,
                detail="Criterion not found."
            )

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
        event=timeline_event_data.event,
        minute=timeline_event_data.minute,
        second=timeline_event_data.second,
        description=timeline_event_data.description,
        team=timeline_event_data.team,
    )

    db.add(timeline_event)
    db.commit()
    db.refresh(timeline_event)

    return timeline_event

def update_event(id, update_event, db):

    timeline_event = db.query(TimelineEvent).filter(TimelineEvent.id == id).first()

    if timeline_event is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    timeline_event.event = update_event.event

    db.commit()
    db.refresh(timeline_event)

    return timeline_event

def delete_event(id, db):
    timeline_event = db.query(TimelineEvent).filter(TimelineEvent.id == id)\
        .first()

    if timeline_event is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    db.delete(timeline_event)

    db.commit()

    return {"message": "Timeline deleted."}