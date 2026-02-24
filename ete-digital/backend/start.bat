@echo off
echo =====================================
echo   ETE Digital Backend Setup ^& Run
echo =====================================
echo.
cd /d %~dp0

set PYTHON=venv\Scripts\python.exe

echo [1/3] Running database migrations...
%PYTHON% -m alembic upgrade head
if errorlevel 1 (
    echo.
    echo [ERROR] Migration failed. Check the error above.
    echo If asked for a password, update DATABASE_URL in .env
    pause
    exit /b 1
)
echo        Done!

echo.
echo [2/3] Seeding test data...
%PYTHON% seed_data.py
if errorlevel 1 (
    echo        Seed skipped ^(data may already exist^)
) else (
    echo        Done!
)

echo.
echo [3/3] Starting FastAPI backend on http://localhost:8000 ...
echo        Press Ctrl+C to stop.
echo.
%PYTHON% -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
