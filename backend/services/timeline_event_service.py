from sqlalchemy.orm import Session

import repositories.timeline_event_repository as repository
import repositories.timeline_repository as timeline_repository
import repositories.match_repository as match_repository
import repositories.criterion_repository as criterion_repository
from models.enums.event_type import EventType
from models.match import Match

from models.timeline_event import TimelineEvent


def timeline_register(timeline_event_data: TimelineEvent, db):

    # Verifica se a 'timeline' existe
    timeline = timeline_repository.get_by_id(timeline_event_data.id_timeline, db)

    # Se for passado um 'criterio', verifica se ele existe
    if timeline_event_data.id_criterion != None:
        criterion_repository.get_by_id(timeline_event_data.id_criterion, db)


    # BUSCA A PARTIDA (Match) atrelada a esta timeline
    match: Match = match_repository.get_by_id(timeline.id_match, db)

    # O time passado deve pertencer à partida
    team = timeline_event_data.team
    _has_team_in_match(team, match)

    # Calcula o tempo total do evento (regular + acréscimo)
    event_time = timeline_event_data.minute_second + (timeline_event_data.additional_minute_second or 0)

    # O tempo do evento deve estar entre o inicio e fim da timeline
    _validate_timeline_range(event_time, timeline.minute_second_started, timeline.minute_second_finished)

    # Se for gol, atualiza a tabela 'MATHES'
    if timeline_event_data.event == "GOAL":
        if match.team_home == team:
            match.home_goals += 1
        else:
            match.away_goals += 1
        match_repository.update(match, db)

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

    # Calcula o novo tempo total do evento
    event_time = update_timeline_event.minute_second + (update_timeline_event.additional_minute_second or 0)

    # Valida se está entre o inicio e o fim da timeline
    _validate_timeline_range(event_time, timeline.minute_second_started, timeline.minute_second_finished)


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

def delete_event(id, db):
    timeline_event = repository.get_by_id(id, db)

    timeline = timeline_repository.get_by_id(timeline_event.id_timeline, db)

    match: Match = match_repository.get_by_id(timeline.id_match, db)

    # Busca o time do evento
    team = timeline_event.team

    # Atualiza a o placar
    if timeline_event.event == EventType.GOAL.value:
        if match.team_home == team:
            match.home_goals -= 1
        else:
            match.away_goals -= 1
        match_repository.update(match, db)

    return repository.delete_event(timeline_event, db)

def get_by_timeline(id_timeline, db):
    timeline_repository.get_by_id(id_timeline, db)
    return repository.get_by_timeline(id_timeline, db)

# Método privado que verifica se o time do evento está na partida
def _has_team_in_match(team: str, match: Match):
    if team != match.team_home and team != match.team_away:
        raise ValueError(
            f"Time inválido: '{team}'. O evento só pode ser atribuído a um dos times "
            f"desta partida ({match.team_home} x {match.team_away})."
        )

# Verifica se o tempo do evento está entre o inicio e o fim da timeline
def _validate_timeline_range(event_time: int, start_time: int, finish_time: int):
    if event_time < start_time:
        raise ValueError(
            f"Tempo inválido: O evento ({event_time}s) não pode "
            f"acontecer antes da timeline começar ({start_time}s)."
        )
    if finish_time is not None:
        if event_time >= finish_time:
            raise ValueError(
                f"Tempo inválido: A timeline já foi encerrada aos {finish_time}s. "
                f"Não é possível cadastrar um evento ocorrido aos {event_time}s."
            )
