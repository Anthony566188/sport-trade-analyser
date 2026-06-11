import json
from fastapi import APIRouter, HTTPException

router = APIRouter()

with open("championships.json", "r", encoding="utf-8") as file:
    championships = json.load(file)

@router.get("/championships")
def get_championships():
    return [
        {
            "id": championship["id"],
            "name": championship["championship"]
        }
        for championship in championships
    ]

@router.get("/championships/{championship_id}/teams")
def get_teams(championship_id: int):
    championship = next(
        (
            championship
            for championship in championships
            if championship["id"] == championship_id
        ),
        None
    )

    if championship is None:
        raise HTTPException(
            status_code=404,
            detail="Championship not found"
        )

    return championship["teams"]