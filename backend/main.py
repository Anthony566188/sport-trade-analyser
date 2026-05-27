from fastapi import FastAPI
from controllers.match_controller import router as match_controller
from controllers.timeline_event_controller import router as timeline_event_controller
from controllers.method_controller import router as method_controller
from controllers.criterion_controller import router as criterion_controller

app = FastAPI()

app.include_router(match_controller)
app.include_router(timeline_event_controller)
app.include_router(method_controller)
app.include_router(criterion_controller)

@app.get("/")
def home():
    return {"message": "API funcionando"}