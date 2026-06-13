@echo off
cd /d "C:\Users\souza\OneDrive\Documentos\sport-trade-analyser\backend"

:: Usa o Python do ambiente virtual diretamente
".venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000

pause