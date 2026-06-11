from fastapi import APIRouter, HTTPException
import services.football_api_service as service

router = APIRouter()

@router.get("/football/leagues")
def get_leagues(country: str = None):
    try:
        return service.get_leagues(country=country)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

'''
@router.get("/football/teams")
def get_teams(league_id: int, season: int):
    try:
        return service.get_teams(league_id=league_id, season=season)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))'''