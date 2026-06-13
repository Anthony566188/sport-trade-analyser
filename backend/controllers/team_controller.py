import json
from fastapi import APIRouter, HTTPException

router = APIRouter()

with open("championships.json", "r", encoding="utf-8") as file:
    championships = json.load(file)

@router.get("/teams")
def get_teams():
    return [
        team
        for championship in championships
        for team in championship["teams"]
    ]



@router.get("/teams/search")
def search_teams(query: str):
    query = query.lower().strip()

    return [
        team
        for championship in championships
        for team in championship["teams"]
        if query in team["name"].lower()
    ]