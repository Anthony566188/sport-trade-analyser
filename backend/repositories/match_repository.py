from models.match import Match

def create_match(db, match_data):
    match = Match(
        team_home=match_data.team_home,
        team_away=match_data.team_away,
        championship=match_data.championship,
        date=match_data.date,
        is_neutral_field=match_data.is_neutral_field,
    )

    db.add(match)
    db.commit()
    db.refresh(match)

    return match

def get_matches_by_date(db, date):
    matches = db.query(Match).filter(Match.date == date).all()
    return matches