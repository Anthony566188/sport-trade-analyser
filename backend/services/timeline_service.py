import repositories.timeline_repository as repository
import repositories.timeline_event_repository as timeline_event_repository
import repositories.match_repository as match_repository
from models.enums.match_period import MatchPeriod
from models.timeline import Timeline
from models.timeline_event import TimelineEvent
from models.value_objects.match_time import check_football_limits, MatchTime


def create(timeline: Timeline, db):
    # Verifica se tem null em MINUTE_SECOND_FINISHED
    repository.has_null_in_minute_second_finished(db)

    match_repository.get_by_id(timeline.id_match, db)

    try:
        # Verifica se a partida tem uma timeline
        repository.get_by_match(timeline.id_match, db)
    except ValueError:
        pass
    else:
        raise ValueError(f"A partida de de id {timeline.id_match} já está associada à uma timeline.")

    return repository.create(timeline, db)

def stop(id: int, match_period: MatchPeriod, minute_second_finished, additional_minute_second, db):

    timeline: Timeline = repository.get_by_id(id, db)

    # Valida a trinca temporal
    try:
        check_football_limits(match_period.value, minute_second_finished,
                              additional_minute_second)

        # Instancia o tempo do inicio da timeline
        initial_time = MatchTime(
            period=MatchPeriod(timeline.match_period_started),
            minute_second=timeline.minute_second_started,
            additional_minute_second=timeline.additional_minute_second_started or 0
        )

        # Instancia o tempo final da timeline
        finished_time = MatchTime(
            period=match_period,
            minute_second=minute_second_finished,
            additional_minute_second=additional_minute_second
        )

        # O térmimo da timeline não pode ser menor que o inicio
        if finished_time < initial_time:
            raise ValueError(
                "Inconsistência temporal: O tempo de encerramento da timeline "
                "não pode ser cronologicamente anterior ao tempo de inicio."
            )

    except ValueError as e:
        raise ValueError(str(e))

    # Busca todos os eventos associados a essa timeline
    events: list[TimelineEvent] = timeline_event_repository.get_by_timeline(id, db)

    # Calcula o tempo máximo entre os eventos.
    # default=None garante que não haja erro caso a lista esteja vazia,
    # independente do tipo de iterável retornado pelo repositório.
    max_event_time = max(
        (
            MatchTime(
                period=MatchPeriod(e.match_period),
                minute_second=e.minute_second,
                additional_minute_second=e.additional_minute_second or 0
            ) for e in events
        ),
        default=None
    )

    # Só executa a validação se existir um tempo máximo calculado
    if max_event_time is not None:
        if finished_time < max_event_time:
            raise ValueError(
                f"O tempo de encerramento da timeline ({finished_time.period.value} - {finished_time.minute_second}s) "
                f"não pode ser anterior ao tempo do último evento registrado ({max_event_time.period.value} - {max_event_time.minute_second}s)."
            )

    # Se passar na validação, atualiza e persiste
    timeline.match_period_finished = match_period.value
    timeline.minute_second_finished = minute_second_finished
    timeline.additional_minute_second_finished = additional_minute_second

    return repository.stop(timeline, db)

def get_by_match(id_match, db):
    return repository.get_by_match(id_match, db)