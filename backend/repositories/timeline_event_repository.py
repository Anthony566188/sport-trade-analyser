from fastapi import HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session
from sqlalchemy import text

from db_utils import handle_db_constraints
from models.timeline_event import TimelineEvent
from models.enums.match_period import PERIOD_ORDER

def timeline_register(timeline_event: TimelineEvent, db):
    db.add(timeline_event)
    with handle_db_constraints(db):
        db.commit()
        db.refresh(timeline_event)
    return timeline_event


def update_timeline_event(update_timeline: TimelineEvent, db: Session):
    with handle_db_constraints(db):
        db.commit()
        db.refresh(update_timeline)
    return update_timeline


def delete_event(timeline_event: TimelineEvent, db: Session):
    db.delete(timeline_event)
    db.commit()
    return {"message": "Timeline_event deleted."}


def get_by_timeline(id_timeline: int, db: Session):
    sql_wording_weights = {period.value: weight for period, weight in PERIOD_ORDER.items()}

    period_sort_logic = case(
        sql_wording_weights,
        value=TimelineEvent.match_period,
        else_=0 # Fallback caso apareça algum valor inesperado
    )

    return (db.query(TimelineEvent)
                .filter(TimelineEvent.id_timeline == id_timeline)
                .order_by(
                    period_sort_logic.desc(),
                    TimelineEvent.minute_second.desc(),
                    # Se for null retorna 0
                    func.coalesce(TimelineEvent.additional_minute_second, 0).desc()
                ).all()
            )


def get_by_id(id: int, db: Session) -> TimelineEvent:
    timeline_event = db.query(TimelineEvent).filter(TimelineEvent.id == id).first()

    if timeline_event is None:
        raise HTTPException(
            status_code=404,
            detail="TimelineEvent not found."
        )

    return timeline_event


def get_top_events_and_criteria(db: Session, limit: int = 5):
    query = text("""
        WITH total AS (
            SELECT COUNT(*) AS qtd_total
            FROM TIMELINE_EVENTS
        )
        SELECT
            c.id AS id_criterion,
            c.title AS title,
            NULL AS event_name,
            COUNT(te.id) AS total_aparicoes
        FROM TIMELINE_EVENTS te
        JOIN CRITERIA c ON te.id_criterion = c.id
        GROUP BY c.id, c.title

        UNION ALL

        SELECT
            NULL AS id_criterion,
            NULL AS title,
            te.event AS event_name,
            COUNT(te.id) AS total_aparicoes
        FROM TIMELINE_EVENTS te
        WHERE te.event IS NOT NULL
        GROUP BY te.event

        ORDER BY total_aparicoes DESC
        LIMIT :limit
    """)
    return db.execute(query, {"limit": limit}).mappings().all()


def get_criteria_averages(db: Session):
    query = text("""
        SELECT
            c.id AS id_criterion,
            c.title AS title,
            COUNT(te.id) AS total_aparicoes,
            ROUND(
                COUNT(te.id) * 1.0 /
                NULLIF((SELECT COUNT(*) FROM MATCHES m WHERE m.date >= c.created_at), 0),
                2
            ) AS media_por_partida
        FROM CRITERIA c
        LEFT JOIN TIMELINE_EVENTS te ON te.id_criterion = c.id
        GROUP BY c.id, c.title, c.created_at
        ORDER BY media_por_partida DESC
    """)
    return db.execute(query).mappings().all()