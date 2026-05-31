import repositories.criterion_repository as repository

def create(criterion, db):
    return repository.create(criterion, db)


def get_all(db):
    return repository.get_all(db)


def update(id, criterion, db):
    return repository.update(id, criterion, db)


def delete(id, db):
    return repository.delete(id, db)


def get_by_id(id, db):
    return repository.get_by_id(id, db)