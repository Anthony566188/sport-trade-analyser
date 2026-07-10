from datetime import date

import repositories.match_repository as repository
from models.match import Match


def register_match(db,match_data):
    if match_data.date == None:
        match_data.date = date.today()

    if match_data.date < date.today():
        raise ValueError(
            "Não é possível passar uma data passada"
        )

    if match_data.team_home == match_data.team_away:
        raise ValueError(
            "Os dois times não podem ser iguais"
        )

    match = Match(
        team_home=match_data.team_home,
        team_away=match_data.team_away,
        championship=match_data.championship,
        date=match_data.date,
        is_neutral_field=match_data.is_neutral_field,
        is_friendly=match_data.is_friendly,
    )
    match.validate_friendly_championship()

    return repository.create_match(db, match)

def get_matches_by_date(db, date):
    return repository.get_matches_by_date(db,date)

def update_match(id, match_updated, db):
    match_updated.validate()
    match = repository.get_by_id(id, db)

    match.team_home = match_updated.team_home
    match.team_away = match_updated.team_away
    match.championship = match_updated.championship
    match.date = match_updated.date
    match.is_neutral_field = match_updated.is_neutral_field
    match.is_friendly = match_updated.is_friendly

    return repository.update(match, db)

def delete(id, db):
    return repository.delete(id, db)

def get_by_id(id, db):
    return repository.get_by_id(id, db)