from datetime import datetime

from models.timeline import Timeline
import repositories.timeline_repository as repository


def create(minute_started, db):

    return repository.create(minute_started, db)


def stop(id, minute_finished, db):
    return repository.stop(id, minute_finished, db)