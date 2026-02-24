# ETE Digital — One-click Backend Setup (using existing postgres user)
# Run from backend\ directory with venv activated:
#   powershell -ExecutionPolicy Bypass -File .\setup_and_run.ps1

Set-Location $PSScriptRoot

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  ETE Digital Backend Setup" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

$python = ".\venv\Scripts\python.exe"

# ── Step 1: Run Alembic migration ────────────────────────────────────
Write-Host "1/3  Running database migrations..." -ForegroundColor Yellow
& $python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
  Write-Host "`n   Migration failed!" -ForegroundColor Red
  Write-Host "   If your postgres user needs a password, run:" -ForegroundColor Yellow
  Write-Host "   psql -U postgres -c `"ALTER USER postgres PASSWORD 'yourpassword';`"" -ForegroundColor Gray
  Write-Host "   Then update .env and alembic.ini with: postgresql://postgres:yourpassword@localhost:5432/postgres" -ForegroundColor Gray
  exit 1
}
Write-Host "   Migration complete!" -ForegroundColor Green

# ── Step 2: Seed data ────────────────────────────────────────────────
Write-Host "`n2/3  Seeding test data..." -ForegroundColor Yellow
& $python seed_data.py
if ($LASTEXITCODE -ne 0) {
  Write-Host "   Seed skipped (data may already exist)" -ForegroundColor Yellow
}
else {
  Write-Host "   Seeded!" -ForegroundColor Green
}

# ── Step 3: Start backend ────────────────────────────────────────────
Write-Host "`n3/3  Starting FastAPI on http://localhost:8000 ..." -ForegroundColor Yellow
Write-Host "     Ctrl+C to stop`n" -ForegroundColor Gray
& $python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
