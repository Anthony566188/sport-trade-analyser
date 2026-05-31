from datetime import datetime

import repositories.timeline_event_repository as repository
from models.timeline_event import TimelineEvent


def timeline_register(timeline: TimelineEvent, db):
    return repository.timeline_register(timeline, db)

def update_timeline_event(id, update_timeline_event, db):
    return repository.update_timeline_event(id, update_timeline_event, db)

def delete_event(id, db):
    return repository.delete_event(id, db)