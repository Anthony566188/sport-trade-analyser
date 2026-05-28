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