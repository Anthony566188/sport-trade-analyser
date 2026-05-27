import repositories.timeline_event_repository as repository

def timeline_register(timeline, db):
    return repository.timeline_register(timeline, db)

def update_event(id, update_event, db):
    return repository.update_event(id, update_event, db)

def delete_event(id, db):
    return repository.delete_event(id, db)