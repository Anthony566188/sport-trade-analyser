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