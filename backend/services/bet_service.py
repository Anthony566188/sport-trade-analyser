from datetime import datetime

from sqlalchemy.orm import Session

import repositories.method_repository as method_repository
import repositories.bet_repository as repository
from models.bet import Bet


def create(bet, db):
    bet.date = datetime.now()
    return repository.create(bet, db)


def get_by_id(id, db):
    return repository.get_by_id(id, db)


def exit(id, exit_odd, db):
    bet: Bet = repository.get_by_id(id, db)

    profit = (bet.entry_odd / exit_odd * bet.stake) - bet.stake
    bet.profit_in_money = profit
    bet.exit_odd = exit_odd

    return repository.exit_bet(id, bet, db)


def update(id: int, updated_bet: Bet, db: Session):
    method_exists = method_repository.get_by_id(updated_bet.id_method, db)
    bet: Bet = repository.get_by_id(id, db)

    if bet.exit_odd is None and updated_bet.exit_odd != None:
        raise ValueError("'exit_odd' não pode ser alterado!")

    bet.id_method = updated_bet.id_method
    bet.stake = updated_bet.stake
    bet.entry_odd = updated_bet.entry_odd
    bet.type = updated_bet.type
    bet.exit_odd = updated_bet.exit_odd

    return repository.update(bet, db)
