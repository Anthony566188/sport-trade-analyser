from fastapi import FastAPI
from controllers.match_controller import router as match_controller

app = FastAPI()

app.include_router(match_controller)

@app.get("/")
def home():
    return {"message": "API funcionando"}