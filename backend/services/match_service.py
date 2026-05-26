import repositories.match_repository as repository

def register_match(db,match_data):
    return repository.create_match(db,match_data)

def get_matches_by_date(db, date):
    return repository.get_matches_by_date(db,date)

