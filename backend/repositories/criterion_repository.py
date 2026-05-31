from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.criterion import Criterion

def create(criterion_data: Criterion, db):

    criterion = Criterion(
        title=criterion_data.title,
        description=criterion_data.description,
    )

    db.add(criterion)
    db.commit()
    db.refresh(criterion)

    return criterion

def get_all(db: Session):
    return db.query(Criterion).all()


def update(id: int, criterion_update: Criterion, db: Session):
    criterion: Criterion = db.query(Criterion).filter(Criterion.id == id).first()

    if criterion is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    criterion.title = criterion_update.title
    criterion.description = criterion_update.description

    db.commit()
    db.refresh(criterion)

    return criterion


def delete(id: int, db: Session):
    criterion = db.query(Criterion).filter(Criterion.id == id).first()

    if criterion is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    db.delete(criterion)
    db.commit()

    return {"message": "Match deleted."}