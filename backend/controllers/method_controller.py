from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.method_request import MethodRequest
import services.method_service as service

router = APIRouter()

@router.post("/method")
def create_method(method: MethodRequest, db: Session = Depends(get_db)):
    return service.create(method, db)