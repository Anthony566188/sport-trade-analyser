from datetime import datetime

from sqlalchemy.orm import Session

import repositories.method_repository as method_repository
import repositories.bet_repository as repository
from models.bet import Bet
from models.enums.bet_type import BetType


def create(bet, db):
    bet.date = datetime.now()
    return repository.create(bet, db)


def get_by_id(id, db):
    return repository.get_by_id(id, db)


def exit(id, exit_odd, exit_minute_second, exit_additional_minute_second, db):
    bet: Bet = repository.get_by_id(id, db)

    if bet.type == BetType.BACK.value:
        profit = (bet.entry_odd / exit_odd * bet.stake) - bet.stake
    else:
        profit = bet.stake * (1 - bet.entry_odd / exit_odd)

    bet.profit_in_money = profit
    bet.exit_odd = exit_odd
    bet.exit_minute_second = exit_minute_second
    bet.exit_additional_minute_second = exit_additional_minute_second

    return repository.exit_bet(bet, db)


def update(id: int, updated_bet: Bet, db: Session):
    method_repository.get_by_id(updated_bet.id_method, db)
    bet: Bet = repository.get_by_id(id, db)

    # Faz com que a aposta só possa ser encerrada através de 'exit'
    if bet.exit_odd is None and updated_bet.exit_odd != None:
        raise ValueError("'exit_odd' não pode ser alterado!")

    bet.id_method = updated_bet.id_method
    bet.stake = updated_bet.stake
    bet.entry_odd = updated_bet.entry_odd
    bet.type = updated_bet.type
    bet.exit_odd = updated_bet.exit_odd

    # Se a aposta já possuir cashout, atualiza os dados da saída
    if updated_bet.exit_odd is not None:
        bet.exit_odd = updated_bet.exit_odd
        bet.exit_minute_second = updated_bet.exit_minute_second
        bet.exit_additional_minute_second = updated_bet.exit_additional_minute_second

        # Recalcula o lucro se stake, entry_odd ou exit_odd tiverem sido modificados na edição
        if bet.type == BetType.BACK.value or bet.type == BetType.BACK:
            profit = (bet.entry_odd / bet.exit_odd * bet.stake) - bet.stake
        else:
            profit = bet.stake * (1 - bet.entry_odd / bet.exit_odd)

        bet.profit_in_money = profit

    return repository.update(bet, db)


def delete(id, db):
    bet_exists = repository.get_by_id(id, db)
    return repository.delete(bet_exists, db)