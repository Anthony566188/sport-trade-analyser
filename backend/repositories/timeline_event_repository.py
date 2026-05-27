from models.timeline_event import TimelineEvent


def timeline_register(timeline, db):
    timeline = TimelineEvent(
        minute=timeline.minute,
        event=timeline.event,
        id_match=timeline.id_match
    )

    db.add(timeline)
    db.commit()
    db.refresh(timeline)

    return timeline

def update_event(id, update_event, db):

    timeline_event = db.query(TimelineEvent).filter(TimelineEvent.id == id).first()

    if not timeline_event:
        return {"message": "Timeline not found."}

    timeline_event.event = update_event.event

    db.commit()
    db.refresh(timeline_event)

    return timeline_event

def delete_event(id, db):
    timeline_event = db.query(TimelineEvent).filter(TimelineEvent.id == id)\
        .first()

    if not timeline_event:
        return {"message": "Timeline not found."}

    db.delete(timeline_event)

    db.commit()

    return {"message": "Timeline deleted."}
