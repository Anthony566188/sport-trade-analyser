import repositories.match_repository as repository

def register_match(db,match_data):
    return repository.create_match(db,match_data)

