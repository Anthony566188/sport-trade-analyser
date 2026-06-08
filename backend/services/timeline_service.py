import repositories.timeline_repository as repository
import repositories.timeline_event_repository as timeline_event_repository

def create(timeline, db):
    return repository.create(timeline, db)

def stop(id, minute_second_finished, db):
    # Busca todos os eventos associados a essa timeline
    events = timeline_event_repository.get_by_timeline(id, db)

    # Valida se o término é menor que algum evento existente
    if events:
        # Pega o maior valor de minute_second entre todos os eventos desta timeline
        max_event_time = max(e.minute_second for e in events)

        if minute_second_finished < max_event_time:
            raise ValueError(
                f"O tempo de encerramento da timeline ({minute_second_finished}s) não pode "
                f"ser menor que o tempo do último evento registrado ({max_event_time}s)."
            )

    return repository.stop(id, minute_second_finished, db)

def get_by_match(id_match, db):
    return repository.get_by_match(id_match, db)