@echo off
REM PostgreSQL Initial Setup Script
REM Run this as Administrator

echo =====================================
echo PostgreSQL Initial Setup
echo =====================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL not found or not in PATH!
    echo Please add PostgreSQL bin directory to PATH.
    echo Example: C:\Program Files\PostgreSQL\16\bin
    pause
    exit /b 1
)

echo PostgreSQL found!
psql --version
echo.

REM Start PostgreSQL service
echo Starting PostgreSQL service...
net start postgresql-x64-16 >nul 2>&1
if %errorlevel% equ 0 (
    echo Service started successfully!
) else (
    echo Service might already be running or different version...
    net start *postgresql* >nul 2>&1
)
echo.

echo =====================================
echo Creating Database and User
echo =====================================
echo.
echo You will be prompted for the postgres password.
echo If this is your first time, the installer should have
echo asked you to set this password during installation.
echo.

REM Create database
echo Creating database 'ete_digital'...
psql -U postgres -c "CREATE DATABASE ete_digital;" 2>nul
if %errorlevel% equ 0 (
    echo Database created successfully!
) else (
    echo Database might already exist or connection failed.
)

REM Create user
echo Creating user 'ete_user'...
psql -U postgres -c "CREATE USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';" 2>nul
if %errorlevel% equ 0 (
    echo User created successfully!
) else (
    echo User might already exist.
)

REM Grant privileges
echo Granting privileges...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ete_digital TO ete_user;"
psql -U postgres -d ete_digital -c "GRANT ALL ON SCHEMA public TO ete_user;"
psql -U postgres -d ete_digital -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ete_user;"
psql -U postgres -d ete_digital -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ete_user;"

echo.
echo =====================================
echo Testing Connection
echo =====================================
echo.

psql -U ete_user -d ete_digital -h localhost -c "SELECT current_database(), current_user;" 2>nul
if %errorlevel% equ 0 (
    echo ✓ Connection test successful!
) else (
    echo ✗ Connection test failed
    echo You may need to check pg_hba.conf settings
)

echo.
echo =====================================
echo Setup Complete!
echo =====================================
echo.
echo Database: ete_digital
echo User: ete_user  
echo Host: localhost:5432
echo.
echo Next steps:
echo 1. cd backend
echo 2. venv\Scripts\activate
echo 3. alembic upgrade head
echo 4. uvicorn app.main:app --reload
echo.
pause
