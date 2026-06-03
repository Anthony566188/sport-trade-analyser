from datetime import datetime

import repositories.bet_repository as repository

def create(bet, db):
    bet.date = datetime.now()
    return repository.create(bet, db)


def get_by_id(id, db):
    return repository.get_by_id(id, db)


def exit(id, exit_odd, db):
    return repository.exit_bet(id, exit_odd, db)