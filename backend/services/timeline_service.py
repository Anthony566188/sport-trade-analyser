import repositories.timeline_repository as repository

def create(timeline, db):
    return repository.create(timeline, db)

def stop(id, minute_finished, db):
    return repository.stop(id, minute_finished, db)