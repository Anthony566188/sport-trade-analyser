import repositories.timeline_repository as repository

def create(timeline, db):
    return repository.create(timeline, db)

def stop(id, minute_second_finished, db):
    return repository.stop(id, minute_second_finished, db)

def get_by_match(id_match, db):
    return repository.get_by_match(id_match, db)