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

@router.get("/criterion")
def get_all_criterions(db: Session = Depends(get_db)):
    return service.get_all(db)

@router.put("/criterion/{id}")
def update_criterion(id: int, request: CriterionRequest, db: Session = Depends(get_db)):
    criterion = request.to_entity()
    return service.update(id, criterion, db)

@router.delete("/criterion/{id}")
def delete_criterion(id: int, db: Session = Depends(get_db)):
    return service.delete(id, db)