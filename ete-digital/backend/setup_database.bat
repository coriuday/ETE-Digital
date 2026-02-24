@echo off
REM Create ETE Digital Database in Local PostgreSQL

echo Creating ETE Digital database...

psql -U postgres -c "CREATE DATABASE ete_digital;"
if %errorlevel% neq 0 (
    echo Database might already exist, continuing...
)

psql -U postgres -c "CREATE USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';"
if %errorlevel% neq 0 (
    echo User might already exist, continuing...
)

psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ete_digital TO ete_user;"

echo.
echo Granting schema privileges...
psql -U postgres -d ete_digital -c "GRANT ALL ON SCHEMA public TO ete_user;"
psql -U postgres -d ete_digital -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ete_user;"
psql -U postgres -d ete_digital -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ete_user;"
psql -U postgres -d ete_digital -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ete_user;"
psql -U postgres -d ete_digital -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ete_user;"

echo.
echo ========================================
echo Database setup complete!
echo ========================================
echo Database: ete_digital
echo User: ete_user
echo Host: localhost:5432
echo ========================================
pause
