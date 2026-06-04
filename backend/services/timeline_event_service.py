import repositories.timeline_event_repository as repository
import repositories.timeline_repository as timeline_repository
import repositories.match_repository as match_repository
import repositories.bet_repository as bet_repository
import repositories.criterion_repository as criterion_repository
from models.criterion import Criterion
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
    timeline_repository.get_by_id(timeline_event_data.id_timeline, db)

    # Se for gol, atualiza a tabela 'MATHES'
    if timeline_event_data.event == "GOAL":
        # Time do evento
        team = timeline_event_data.team

        # Busca a timeline para 'depois' buscar a 'partida'
        timeline = timeline_repository.get_by_id(timeline_event_data.id_timeline, db)
        match: Match = match_repository.get_by_id(timeline.id_match, db)

        if match.team_home == team:
            match.home_goals += 1
        else:
            match.away_goals += 1

        match_repository.update(match, db)

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
    timeline_event = repository.get_by_id(id, db)

    # Se for passado um critério, verifica se ele existe
    if update_timeline_event.id_criterion != None:
        criterion_existis: Criterion = criterion_repository.get_by_id(update_timeline_event.id_criterion, db)

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
    timeline_exists = timeline_repository.get_by_id(id_timeline, db)
    return repository.get_by_timeline(id_timeline, db)