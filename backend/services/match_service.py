from datetime import date

import repositories.match_repository as repository
from models.match import Match


def register_match(db,match_data):
    if match_data.date == None:
        match_data.date = date.today()

    match = Match(
        team_home=match_data.team_home,
        team_away=match_data.team_away,
        home_goals=match_data.home_goals,
        away_goals=match_data.away_goals,
        championship=match_data.championship,
        date=match_data.date,
        is_neutral_field=match_data.is_neutral_field,
        is_friendly=match_data.is_friendly,
    )

    return repository.create_match(db,match)


def get_matches_by_date(db, date):
    return repository.get_matches_by_date(db,date)


def update_match(id, match, db):
    return repository.update(id, match, db)


def delete(id, db):
    return repository.delete(id, db)


def get_by_id(id, db):
    return repository.get_by_id(id, db)