from contextlib import contextmanager
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from exceptions.exceptions import BetChronologyError, InvalidPeriodError, InvalidBetTypeError, InvalidBetStakeError, \
    InvalidBetOddError, BetEntryTimeError, EventOrCriterionError, AdditionalTimeError


@contextmanager
def handle_db_constraints(db: Session):
    """
    Gerenciador de contexto para centralizar o tratamento de constraints do banco.
    Realiza o rollback automaticamente caso uma exceção seja capturada.
    """
    try:
        # O 'yield' pausa a função e executa o que estiver dentro do bloco 'with'
        yield

    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)

        if "CK_BETS_CHRONOLOGY" in error_msg:
            raise BetChronologyError()

        elif "CK_BETS_ENTRY_PERIOD" in error_msg or "CK_BETS_EXIT_PERIOD" in error_msg or "CK_MATCH_PERIOD_VALUES" in error_msg:
            raise InvalidPeriodError()

        elif "BETS_TYPE_CK" in error_msg:
            raise InvalidBetTypeError()

        elif "BETS_STAKE_CK" in error_msg:
            raise InvalidBetStakeError()

        elif "BETS_ENTRY_ODD_CK" in error_msg:
            raise InvalidBetOddError()

        elif "BETS_ENTRY_TIME_CK" in error_msg:
            raise BetEntryTimeError()

        elif "CK_MATCH_PERIOD_VALUES" in error_msg:
            raise EventOrCriterionError()

        elif "CK_ADDITIONAL_TIME" in error_msg:
            raise AdditionalTimeError()

        # Se a mensagem não corresponder a nenhum CHECK constraint conhecido, propaga a IntegrityError.
        else:
            raise e