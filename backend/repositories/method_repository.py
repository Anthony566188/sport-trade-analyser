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

