@echo off
REM PostgreSQL Password Reset Helper Script
REM Run this as Administrator

echo =====================================
echo PostgreSQL Password Reset Helper
echo =====================================
echo.

REM Find PostgreSQL installation
set PG_PATH=
if exist "C:\Program Files\PostgreSQL\16\data" set PG_PATH=C:\Program Files\PostgreSQL\16
if exist "C:\Program Files\PostgreSQL\15\data" set PG_PATH=C:\Program Files\PostgreSQL\15
if exist "C:\Program Files\PostgreSQL\14\data" set PG_PATH=C:\Program Files\PostgreSQL\14
if exist "C:\Program Files\PostgreSQL\13\data" set PG_PATH=C:\Program Files\PostgreSQL\13

if "%PG_PATH%"=="" (
    echo ERROR: PostgreSQL installation not found!
    echo Please check your PostgreSQL installation path.
    pause
    exit /b 1
)

echo Found PostgreSQL at: %PG_PATH%
echo.

echo Step 1: Backing up pg_hba.conf...
copy "%PG_PATH%\data\pg_hba.conf" "%PG_PATH%\data\pg_hba.conf.backup" >nul
if %errorlevel% neq 0 (
    echo ERROR: Cannot backup pg_hba.conf. Are you running as Administrator?
    pause
    exit /b 1
)
echo Backup created: pg_hba.conf.backup
echo.

echo Step 2: Modifying pg_hba.conf for trust authentication...
powershell -Command "(Get-Content '%PG_PATH%\data\pg_hba.conf') -replace 'scram-sha-256', 'trust' | Set-Content '%PG_PATH%\data\pg_hba.conf'"
echo Modified pg_hba.conf
echo.

echo Step 3: Restarting PostgreSQL service...
net stop postgresql-x64-* >nul 2>&1
net stop *postgresql* >nul 2>&1
timeout /t 2 /nobreak >nul

net start postgresql-x64-* >nul 2>&1
net start *postgresql* >nul 2>&1
timeout /t 3 /nobreak >nul
echo PostgreSQL restarted
echo.

echo =====================================
echo Step 4: CHANGE YOUR PASSWORD NOW
echo =====================================
echo.
echo Run the following commands:
echo.
echo   psql -U postgres
echo   ALTER USER postgres WITH PASSWORD 'your_new_password';
echo   ALTER USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';
echo   \q
echo.
echo After changing passwords, run: restore_pg_security.bat
echo.
pause
