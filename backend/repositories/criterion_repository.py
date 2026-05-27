from fastapi import HTTPException

from models.criterion import Criterion
from models.method import Method


def create(criterion_data: Criterion, db):

    method_exists = (
        db.query(Method.id)
        .filter(Method.id == criterion_data.id_method)
        .first()
    )

    if method_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Method not found."
        )

    criterion = Criterion(
        id_method=criterion_data.id_method,
        title=criterion_data.title,
        description=criterion_data.description,
    )

    db.add(criterion)
    db.commit()
    db.refresh(criterion)

    return criterion