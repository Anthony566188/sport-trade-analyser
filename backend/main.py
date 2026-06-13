from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from controllers.match_controller import router as match_controller
from controllers.timeline_event_controller import router as timeline_event_controller
from controllers.method_controller import router as method_controller
from controllers.criterion_controller import router as criterion_controller
from controllers.timeline_controller import router as timeline_controller
from controllers.event_type_controller import router as event_type_controller
from controllers.bet_controller import router as bet_controller
from controllers.football_api_controller import router as football_api_controller
from controllers.championship_controller import router as championship_controller
from controllers.team_controller import router as team_controller

app = FastAPI()

app.include_router(match_controller)
app.include_router(timeline_event_controller)
app.include_router(method_controller)
app.include_router(criterion_controller)
app.include_router(timeline_controller)
app.include_router(event_type_controller)
app.include_router(bet_controller)
#app.include_router(football_api_controller)
app.include_router(championship_controller)
app.include_router(team_controller)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Em produção local: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "API funcionando"}