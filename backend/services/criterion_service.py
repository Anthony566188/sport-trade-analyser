from datetime import datetime

import repositories.criterion_repository as repository
from models.criterion import Criterion

def create(criterion_data: Criterion, db):

    criterion_data.created_at = datetime.now().date()

    criterion = Criterion(
        title=criterion_data.title,
        description=criterion_data.description,
        created_at=criterion_data.created_at,
    )

    return repository.create(criterion, db)


def get_all(db):
    return repository.get_all(db)


def update(id, criterion, db):
    return repository.update(id, criterion, db)


def delete(id, db):
    return repository.delete(id, db)


def get_by_id(id, db):
    return repository.get_by_id(id, db)