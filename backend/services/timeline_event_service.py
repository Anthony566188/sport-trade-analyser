import repositories.timeline_event_repository as repository
import repositories.timeline_repository as timeline_repository
import repositories.match_repository as match_repository
import repositories.criterion_repository as criterion_repository
from models.enums.event_type import EventType
from models.enums.match_period import MatchPeriod
from models.match import Match

from models.timeline_event import TimelineEvent
from models.value_objects.match_time import MatchTime
from schemas.frequent_selection_response import FrequentSelectionResponse


def timeline_register(timeline_event_data: TimelineEvent, db):

    # Verifica se a 'timeline' existe
    timeline = timeline_repository.get_by_id(timeline_event_data.id_timeline, db)

    # Se for passado um 'criterio', verifica se ele existe
    if timeline_event_data.id_criterion != None:
        criterion_repository.get_by_id(timeline_event_data.id_criterion, db)

    # BUSCA A PARTIDA (Match) atrelada a esta timeline
    match: Match = match_repository.get_by_id(timeline.id_match, db)

    # Regra de negócio: Exatamente UM campo (entre: id_criterion e event) deve estar preenchido
    campos_preenchidos = sum([
        1 for campo in [
            timeline_event_data.id_criterion,
            timeline_event_data.event
        ] if campo is not None
    ])
    if campos_preenchidos != 1:
        raise ValueError(
            "É obrigatório associar exatamente UM dos campos "
            "(id_criterion ou event). Não é permitido enviar mais de um, nem nenhum."
        )


    # O time passado deve pertencer à partida
    team = timeline_event_data.team
    _has_team_in_match(team, match)

    # Busca a trinca temporal do evento e do inicio da timeline
    event_time = MatchTime(MatchPeriod(timeline_event_data.match_period), timeline_event_data.minute_second, timeline_event_data.additional_minute_second or 0)
    timeline_start_time = MatchTime(MatchPeriod(timeline.match_period_started), timeline.minute_second_started, timeline.additional_minute_second_started or 0)

    # Validação para impedir que seja cadastrado um evento fora do intervalo de tempo da timeline
    if timeline.match_period_finished is not None and timeline.minute_second_finished is not None:
        timeline_finished_time = MatchTime(MatchPeriod(timeline.match_period_finished),
                                           timeline.minute_second_finished,
                                           timeline.additional_minute_second_finished or 0)

        # O tempo do evento deve estar entre o inicio e fim da timeline
        _validate_timeline_range(event_time, timeline_start_time, timeline_finished_time)
    else:
        _validate_timeline_range(event_time, timeline_start_time, None)

    # Atualiza a o placar
    if timeline_event_data.event == EventType.GOAL.value:
        if match.team_home == team:
            timeline.home_goals += 1
        else:
            timeline.away_goals += 1
        timeline_repository.update(timeline, db)


    timeline_event = TimelineEvent(
        id_criterion=timeline_event_data.id_criterion,
        id_timeline=timeline_event_data.id_timeline,
        event=timeline_event_data.event,
        match_period=timeline_event_data.match_period,
        minute_second=timeline_event_data.minute_second,
        additional_minute_second=timeline_event_data.additional_minute_second,
        team=timeline_event_data.team,
    )

    return repository.timeline_register(timeline_event, db)

'''
def update_timeline_event(id, update_timeline_event: TimelineEvent, db):
    # Busca o timeline_event
    timeline_event: TimelineEvent = repository.get_by_id(id, db)

    # Busca a timeline atrelada a este evento
    timeline = timeline_repository.get_by_id(timeline_event.id_timeline, db)

    # Busca a partida associada
    match: Match = match_repository.get_by_id(timeline.id_match, db)

    # Time do evento
    new_team = update_timeline_event.team

    # Verifica se o time passado é um dos times que estão se enfrentando
    _has_team_in_match(new_team, match)

    # Busca a trinca temporal do evento e do inicio da timeline
    event_time = MatchTime(MatchPeriod(update_timeline_event.match_period), update_timeline_event.minute_second,
                           update_timeline_event.additional_minute_second or 0)
    timeline_start_time = MatchTime(MatchPeriod(timeline.match_period_started), timeline.minute_second_started,
                                    timeline.additional_minute_second_started or 0)

    # Validação para impedir que seja cadastrado um evento fora do intervalo de tempo da timeline
    if timeline.match_period_finished is not None and timeline.minute_second_finished is not None:
        timeline_finished_time = MatchTime(MatchPeriod(timeline.match_period_finished),
                                           timeline.minute_second_finished,
                                           timeline.additional_minute_second_finished or 0)

        # O tempo do evento deve estar entre o inicio e fim da timeline
        _validate_timeline_range(event_time, timeline_start_time, timeline_finished_time)
    else:
        _validate_timeline_range(event_time, timeline_start_time, None)


    # Se for passado um critério, verifica se ele existe
    if update_timeline_event.id_criterion != None:
        criterion_repository.get_by_id(update_timeline_event.id_criterion, db)

    # Regra de negócio: Exatamente UM campo deve estar preenchido
    campos_preenchidos = sum([
        1 for campo in [
            update_timeline_event.event,
            update_timeline_event.id_criterion
        ] if campo is not None
    ])
    if campos_preenchidos != 1:
        raise ValueError(
            "Regra de Negócio: É obrigatório associar exatamente UM dos campos "
            "(id_criterion ou event). Não é permitido enviar mais de um, nem nenhum."
        )

    timeline_event.id_criterion = update_timeline_event.id_criterion
    timeline_event.event = update_timeline_event.event
    timeline_event.minute_second = update_timeline_event.minute_second
    timeline_event.additional_minute_second = update_timeline_event.additional_minute_second
    timeline_event.team = update_timeline_event.team

    return repository.update_timeline_event(timeline_event, db)
'''

def delete_event(id, db):
    timeline_event = repository.get_by_id(id, db)

    timeline = timeline_repository.get_by_id(timeline_event.id_timeline, db)

    match: Match = match_repository.get_by_id(timeline.id_match, db)

    # Busca o time do evento
    team = timeline_event.team

    # Atualiza a o placar
    if timeline_event.event == EventType.GOAL.value:
        if match.team_home == team:
            timeline.home_goals -= 1
        else:
            timeline.away_goals -= 1
        match_repository.update(match, db)

    return repository.delete_event(timeline_event, db)

def get_by_timeline(id_timeline, db):
    timeline_repository.get_by_id(id_timeline, db)
    return repository.get_by_timeline(id_timeline, db)


def get_frequent_selections(db) -> list[FrequentSelectionResponse]:
    top_5_raw = repository.get_top_events_and_criteria(db, limit=5)
    averages_raw = repository.get_criteria_averages(db)

    averages_dict = {
        row["id_criterion"]: row["media_por_partida"] or 0.0
        for row in averages_raw
    }

    final_selections = []
    top_5_criteria_averages = []

    # Lista auxiliar para controle de duplicatas usando uma estrutura simples
    # Salvamos tuplas de (tipo, id) para garantir que um evento não barre um critério com o mesmo ID
    items_already_in_top_5 = []

    # Processa o TOP 5 absoluto
    for row in top_5_raw:
        is_criterion = row["id_criterion"] is not None
        item_type = "CRITERION" if is_criterion else "EVENT"

        avg = averages_dict.get(row["id_criterion"]) if is_criterion else None

        if is_criterion and avg is not None:
            top_5_criteria_averages.append(avg)

        # Guardamos no controle local
        items_already_in_top_5.append((item_type, row["id_criterion"]))

        final_selections.append(FrequentSelectionResponse(
            id_criterion=row["id_criterion"],
            title=row["title"],
            event=row["event_name"],
        ))

    # Regra de Negócio para "HIGH_AVERAGE"
    if top_5_criteria_averages:
        min_top_5_avg = min(top_5_criteria_averages)

        for row in averages_raw:
            crit_id = row["id_criterion"]
            avg = row["media_por_partida"] or 0.0

            # Verificamos se já existe um CRITERION com esse id no top 5 usando a nossa lista de controle
            if avg > min_top_5_avg and ("CRITERION", crit_id) not in items_already_in_top_5:
                final_selections.append(FrequentSelectionResponse(
                    id_criterion=crit_id,
                    title=row["title"],
                    event=None,
                ))

    return final_selections

# Método privado que verifica se o time do evento está na partida
def _has_team_in_match(team: str, match: Match):
    if team != match.team_home and team != match.team_away:
        raise ValueError(
            f"Time inválido: '{team}'. O evento só pode ser atribuído a um dos times "
            f"desta partida ({match.team_home} x {match.team_away})."
        )

# Verifica se o tempo do evento está entre o inicio e o fim da timeline
def _validate_timeline_range(event_time: MatchTime, start_time: MatchTime, finish_time: MatchTime | None):
    if event_time < start_time:
        raise ValueError(
            f"Tempo inválido: O evento não pode "
            f"acontecer antes da timeline começar "
            f"({start_time.period.value} - {start_time.minute_second}s'{start_time.additional_minute_second if start_time.additional_minute_second else 0})."
        )
    if finish_time is not None:
        if event_time > finish_time:
            raise ValueError(
                f"Tempo inválido: A timeline já foi encerrada aos "
                f"[{finish_time.period.value} - {finish_time.minute_second}s'{finish_time.additional_minute_second if finish_time.additional_minute_second else 0}]."
            )
