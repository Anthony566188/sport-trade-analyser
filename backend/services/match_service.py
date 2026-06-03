from datetime import date

import repositories.match_repository as repository

def register_match(db,match_data):
    if match_data.date == None:
        match_data.date = date.today()

    return repository.create_match(db,match_data)


def get_matches_by_date(db, date):
    return repository.get_matches_by_date(db,date)


def update_match(id, match, db):
    return repository.update(id, match, db)


def delete(id, db):
    return repository.delete(id, db)


def get_by_id(id, db):
    return repository.get_by_id(id, db)