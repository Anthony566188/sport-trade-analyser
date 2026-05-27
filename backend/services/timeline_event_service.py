import repositories.timeline_event_repository as repository
from models.timeline_event import TimelineEvent


def timeline_register(timeline, db):
    return repository.timeline_register(timeline, db)