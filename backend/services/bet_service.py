from datetime import datetime

from sqlalchemy.orm import Session

import repositories.method_repository as method_repository
import repositories.bet_repository as repository
import repositories.match_repository as match_repository
from models.bet import Bet
from models.enums.bet_type import BetType
from models.enums.match_period import MatchPeriod
from models.value_objects.match_time import MatchTime
from schemas.bet_exit_request import BetExitRequest


def create(bet: Bet, db):

    method_repository.get_by_id(bet.id_method, db)
    match_repository.get_by_id(bet.id_match, db)

    bet.date = datetime.now()

    bet = Bet(
        id_method=bet.id_method,
        id_match=bet.id_match,
        stake=bet.stake,
        entry_odd=bet.entry_odd,
        type=bet.type,
        date=bet.date,
        entry_period=bet.entry_period,
        entry_minute_second=bet.entry_minute_second,
        entry_additional_minute_second=bet.entry_additional_minute_second,
    )

    return repository.create(bet, db)


def get_by_id(id, db):
    return repository.get_by_id(id, db)


def exit(id, exit_data: BetExitRequest, db) -> Bet:
    bet: Bet = repository.get_by_id(id, db)

    if bet.exit_period is not None:
        raise ValueError("Esta aposta já foi encerrada.")

    # Instancia os Objetos de Valor Temporais para comparação
    time_entry = MatchTime(
        period=MatchPeriod(bet.entry_period),
        minute_second=bet.entry_minute_second,
        additional_minute_second=bet.entry_additional_minute_second
    )

    time_exit = MatchTime(
        period=MatchPeriod(exit_data.exit_period),
        minute_second=exit_data.exit_minute_second,
        additional_minute_second=exit_data.exit_additional_minute_second
    )

    # Validação Cronológica
    if time_entry > time_exit:
        raise ValueError(
            "Inconsistência temporal: O tempo de saída da aposta "
            "não pode ser anterior ao tempo de entrada."
        )

    bet.exit_odd = exit_data.exit_odd
    bet.exit_period = exit_data.exit_period.value # Salva a string
    bet.exit_minute_second = exit_data.exit_minute_second
    bet.exit_additional_minute_second = exit_data.exit_additional_minute_second

    return repository.update(bet, db)


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