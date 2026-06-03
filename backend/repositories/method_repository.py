from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.method import Method
from schemas.method_request import MethodRequest


def create(method_data: MethodRequest, db):
    method = Method(
        name=method_data.name
    )

    db.add(method)
    db.commit()
    db.refresh(method)

    return method


def get_all(db: Session):
    methods = db.query(Method).all()
    return methods


def update(id, method, db):
    method_exists = db.query(Method).filter(Method.id == id).first()

    if method_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    method_exists.name = method.name

    db.commit()
    db.refresh(method_exists)

    return method_exists

def delete(id, db):
    method_exists = db.query(Method).filter(Method.id == id) \
        .first()

    if method_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Id not found."
        )

    db.delete(method_exists)
    db.commit()

    return {"message": "Method deleted."}

def get_by_id(id, db):
    method_exists = db.query(Method).filter(Method.id == id).first()

    if method_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Method not found."
        )

    return method_exists