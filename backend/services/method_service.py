import repositories.method_repository as repository

def create(method, db):
    return repository.create(method,db)


def get_all(db):
    return repository.get_all(db)


def update_method(id, method, db):
    return repository.update(id, method,db)


def delete(id, db):
    return repository.delete(id,db)


def get_by_id(id, db):
    return repository.get_by_id(id,db)