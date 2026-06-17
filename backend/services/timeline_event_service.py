import repositories.timeline_event_repository as repository
import repositories.timeline_repository as timeline_repository
import repositories.match_repository as match_repository
import repositories.bet_repository as bet_repository
import repositories.criterion_repository as criterion_repository
from models.match import Match

from models.timeline_event import TimelineEvent


def timeline_register(timeline_event_data: TimelineEvent, db):

    # Se for passado um 'criterio', verifica se ele existe
    if timeline_event_data.id_criterion != None:
        criterion_repository.get_by_id(timeline_event_data.id_criterion, db)

    # Se for passado uma 'bet', verifica se ela existe
    if timeline_event_data.id_bet != None:
        bet_repository.get_by_id(timeline_event_data.id_bet, db)

    # Verifica se a 'timeline' existe
    timeline = timeline_repository.get_by_id(timeline_event_data.id_timeline, db)

    # BUSCA A PARTIDA (Match) atrelada a esta timeline
    match: Match = match_repository.get_by_id(timeline.id_match, db)

    # O time passado deve pertencer à partida
    team = timeline_event_data.team
    if team != match.team_home and team != match.team_away:
        raise ValueError(
            f"Time inválido: '{team}'. O evento só pode ser atribuído a um dos times "
            f"desta partida ({match.team_home} x {match.team_away})."
        )

    # Calcula o tempo total do evento (regular + acréscimo)
    event_time = timeline_event_data.minute_second + (timeline_event_data.additional_minute_second or 0)
    # O tempo do evento não pode ser antes do início
    if event_time < timeline.minute_second_started:
        raise ValueError(
            f"Tempo inválido: O evento ({event_time}s) não pode "
            f"acontecer antes da timeline começar ({timeline.minute_second_started}s)."
        )

    # O evento não pode acontecer depois do encerramento da timeline
    if timeline.minute_second_finished is not None:
        if event_time >= timeline.minute_second_finished:
            raise ValueError(
                f"Tempo inválido: A timeline já foi encerrada aos {timeline.minute_second_finished}s. "
                f"Não é possível cadastrar um evento ocorrido aos {event_time}s."
            )

    # Se for gol, atualiza a tabela 'MATHES'
    if timeline_event_data.event == "GOAL":
        if match.team_home == team:
            match.home_goals += 1
        else:
            match.away_goals += 1
        match_repository.update(match, db)

    # Regra de negócio: Exatamente UM campo (entre: id_criterion, id_bet e event) deve estar preenchido
    campos_preenchidos = sum([
        1 for campo in [
            timeline_event_data.id_criterion,
            timeline_event_data.id_bet,
            timeline_event_data.event
        ] if campo is not None
    ])
    if campos_preenchidos != 1:
        raise ValueError(
            "É obrigatório associar exatamente UM dos campos "
            "(id_criterion, id_bet ou event). Não é permitido enviar mais de um, nem nenhum."
        )


    timeline_event = TimelineEvent(
        id_criterion=timeline_event_data.id_criterion,
        id_timeline=timeline_event_data.id_timeline,
        id_bet=timeline_event_data.id_bet,
        event=timeline_event_data.event,
        minute_second=timeline_event_data.minute_second,
        additional_minute_second=timeline_event_data.additional_minute_second,
        description=timeline_event_data.description,
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

    # Valida o novo time passado na atualização
    new_team = update_timeline_event.team

    # Verifica se o time passado é um dos times que estão se enfrentando
    if new_team != match.team_home and new_team != match.team_away:
        raise ValueError(
            f"Time inválido: '{new_team}'. O evento atualizado só pode pertencer "
            f"a um dos times da partida ({match.team_home} x {match.team_away})."
        )

    # Calcula o novo tempo total do evento
    event_time = update_timeline_event.minute_second + (update_timeline_event.additional_minute_second or 0)

    # Valida se não é menor que o início
    if event_time < timeline.minute_second_started:
        raise ValueError(
            f"Tempo inválido: O evento atualizado ({event_time}s) "
            f"não pode acontecer antes da timeline começar ({timeline.minute_second_started}s)."
        )

    # Valida se não é maior ou igual ao término (caso a timeline já esteja fechada)
    if timeline.minute_second_finished is not None:
        if event_time >= timeline.minute_second_finished:
            raise ValueError(
                f"Tempo inválido: A timeline associada já foi encerrada aos {timeline.minute_second_finished}s. "
                f"O evento atualizado ({event_time}s) deve ocorrer antes do encerramento."
            )

    # Se for passado um critério, verifica se ele existe
    if update_timeline_event.id_criterion != None:
        criterion_repository.get_by_id(update_timeline_event.id_criterion, db)

    # Regra de negócio: Exatamente UM campo deve estar preenchido
    campos_preenchidos = sum([
        1 for campo in [
            timeline_event.id_bet,
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
    timeline_event.description = update_timeline_event.description
    timeline_event.team = update_timeline_event.team

    return repository.update_timeline_event(timeline_event, db)

def delete_event(id, db):
    timeline_event = repository.get_by_id(id, db)
    return repository.delete_event(timeline_event, db)

def get_by_timeline(id_timeline, db):
    timeline_repository.get_by_id(id_timeline, db)
    return repository.get_by_timeline(id_timeline, db)