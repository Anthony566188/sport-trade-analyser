from fastapi import HTTPException

from models.match import Match
from models.timeline_event import TimelineEvent


def timeline_register(timeline: TimelineEvent, db):

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

    timeline = TimelineEvent(
        id_match=timeline.id_match,
        minute=timeline.minute,
        second=timeline.second,
        event=timeline.event,
        description=timeline.description,
    )

    db.add(timeline)
    db.commit()
    db.refresh(timeline)

    return timeline

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