from typing import List

from exceptions.exceptions import TimelineScoreRegressionError
import repositories.timeline_repository as repository
import repositories.timeline_event_repository as timeline_event_repository
import repositories.match_repository as match_repository
from models.enums.match_period import MatchPeriod
from models.timeline import Timeline
from models.timeline_event import TimelineEvent
from models.value_objects.match_time import check_football_limits, MatchTime


def create(timeline: Timeline, db):
    # Verifica se tem uma timeline aberta na partida
    repository.has_open_timeline_in_match(timeline.id_match, db)

    # Verifica se a partida existe
    match_repository.get_by_id(timeline.id_match, db)

    # Busca todas as timelines da partida
    timelines: List[Timeline] = repository.get_by_match(timeline.id_match, db)

    start_time = MatchTime(MatchPeriod(timeline.match_period_started), timeline.minute_second_started, timeline.additional_minute_second_started or 0)

    for t in timelines:
        _validate_timeline_range(t, start_time)

    _validate_score_does_not_regress(timeline, timelines, start_time)

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

    # Busca as timelines da partida
    timelines: list[Timeline] = repository.get_by_match(timeline.id_match, db)

    for t in timelines:
        if t.id == timeline.id:
            continue

        _validate_timeline_range(t, initial_time, finished_time)

    # Se passar na validação, atualiza e persiste
    timeline.match_period_finished = match_period.value
    timeline.minute_second_finished = minute_second_finished
    timeline.additional_minute_second_finished = additional_minute_second

    return repository.stop(timeline, db)

def get_by_match(id_match, db):
    return repository.get_by_match(id_match, db)


def _validate_timeline_range(
    timeline_exist: Timeline,
    start_time: MatchTime,
    finished_time: MatchTime | None = None
):
    existing_range = _get_closed_timeline_range(timeline_exist)

    if existing_range is None:
        return

    existing_start_time, existing_finished_time = existing_range

    if finished_time is None:
        _validate_start_time_outside_existing_range(
            start_time,
            existing_start_time,
            existing_finished_time
        )
        return

    _validate_interval_outside_existing_range(
        start_time,
        finished_time,
        existing_start_time,
        existing_finished_time
    )


def _get_closed_timeline_range(timeline: Timeline) -> tuple[MatchTime, MatchTime] | None:
    if (
        timeline.match_period_finished is None
        or timeline.minute_second_finished is None
    ):
        return None

    return (
        MatchTime(
            MatchPeriod(timeline.match_period_started),
            timeline.minute_second_started,
            timeline.additional_minute_second_started or 0
        ),
        MatchTime(
            MatchPeriod(timeline.match_period_finished),
            timeline.minute_second_finished,
            timeline.additional_minute_second_finished or 0
        )
    )


def _validate_score_does_not_regress(
    new_timeline: Timeline,
    existing_timelines: list[Timeline],
    new_start_time: MatchTime
):
    previous_timeline = _get_immediately_previous_timeline(
        existing_timelines,
        new_start_time
    )

    if previous_timeline is None:
        return

    if (
        new_timeline.home_goals < previous_timeline.home_goals
        or new_timeline.away_goals < previous_timeline.away_goals
    ):
        raise TimelineScoreRegressionError(
            "Placar invalido: a nova timeline nao pode ter placar menor que "
            "a timeline imediatamente anterior. "
            f"Placar anterior: {previous_timeline.home_goals}x{previous_timeline.away_goals}; "
            f"placar informado: {new_timeline.home_goals}x{new_timeline.away_goals}."
        )


def _get_immediately_previous_timeline(
    timelines: list[Timeline],
    reference_time: MatchTime
) -> Timeline | None:
    previous_candidates: list[tuple[MatchTime, Timeline]] = []

    for timeline in timelines:
        existing_range = _get_closed_timeline_range(timeline)

        if existing_range is None:
            continue

        _, existing_finished_time = existing_range

        if existing_finished_time <= reference_time:
            previous_candidates.append((existing_finished_time, timeline))

    if not previous_candidates:
        return None

    return max(previous_candidates, key=lambda candidate: candidate[0])[1]


def _validate_start_time_outside_existing_range(
    start_time: MatchTime,
    existing_start_time: MatchTime,
    existing_finished_time: MatchTime
):
    if existing_start_time <= start_time < existing_finished_time:
        raise ValueError(
            "Tempo invalido: O inicio desta Timeline nao pode estar dentro "
            "do intervalo de uma timeline existente."
        )


def _validate_interval_outside_existing_range(
    start_time: MatchTime,
    finished_time: MatchTime,
    existing_start_time: MatchTime,
    existing_finished_time: MatchTime
):
    if start_time < existing_finished_time and finished_time > existing_start_time:
        raise ValueError(
            "Tempo invalido: O intervalo desta Timeline nao pode sobrepor "
            "o intervalo de uma timeline existente."
        )
