from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException

import repositories.bet_repository as repository
from models.bet import Bet


def create(bet, db):
    bet.date = datetime.now()
    return repository.create(bet, db)


def get_by_id(id, db):
    return repository.get_by_id(id, db)


def exit(id, exit_odd, db):
    bet: Bet = repository.get_by_id(id, db)
    if bet is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    profit = (bet.entry_odd / exit_odd * bet.stake) - bet.stake
    bet.profit_in_money = profit
    bet.exit_odd = exit_odd

    return repository.exit_bet(id, bet, db)