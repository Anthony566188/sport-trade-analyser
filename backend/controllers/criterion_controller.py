from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.criterion_request import CriterionRequest
import services.criterion_service as service

router = APIRouter()

@router.post("/criterion")
def create_criterion(request: CriterionRequest, db: Session = Depends(get_db)):
    criterion = request.to_entity()
    return service.create(criterion, db)