from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.method_request import MethodRequest
import services.method_service as service

router = APIRouter()

@router.post("/method")
def create_method(method: MethodRequest, db: Session = Depends(get_db)):
    return service.create(method, db)

@router.get("/method")
def get_all(db: Session = Depends(get_db)):
    return service.get_all(db)

@router.put("/method/{id}")
def update_method(id: int, method: MethodRequest, db: Session = Depends(get_db)):
    return service.update_method(id, method, db)

@router.delete("/method/{id}")
def delete_method(id: int, db: Session = Depends(get_db)):
    return service.delete(id, db)