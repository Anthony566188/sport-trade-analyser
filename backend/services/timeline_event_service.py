import repositories.timeline_event_repository as repository
import repositories.timeline_repository as timeline_repository
import repositories.match_repository as match_repository
from models.match import Match

from models.timeline_event import TimelineEvent


def timeline_register(timeline_event: TimelineEvent, db):
    if timeline_event.event == "GOAL":
        # Time do evento
        team = timeline_event.team

        # Busca a timeline para 'depois' buscar a 'partida'
        timeline = timeline_repository.get_by_id(timeline_event.id_timeline, db)
        match: Match = match_repository.get_by_id(timeline.id_match, db)

        if match.team_home == team:
            match.home_goals += 1
        else:
            match.away_goals += 1

        match_repository.update(match, db)

    return repository.timeline_register(timeline_event, db)

def update_timeline_event(id, update_timeline_event, db):
    return repository.update_timeline_event(id, update_timeline_event, db)

def delete_event(id, db):
    return repository.delete_event(id, db)

def get_by_timeline(id_timeline, db):
    return repository.get_by_timeline(id_timeline, db)