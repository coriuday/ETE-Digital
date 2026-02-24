@echo off
REM Restore PostgreSQL Security Settings
REM Run this as Administrator AFTER changing your password

echo =====================================
echo Restoring PostgreSQL Security
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
    pause
    exit /b 1
)

echo Found PostgreSQL at: %PG_PATH%
echo.

echo Step 1: Restoring pg_hba.conf from backup...
if exist "%PG_PATH%\data\pg_hba.conf.backup" (
    copy "%PG_PATH%\data\pg_hba.conf.backup" "%PG_PATH%\data\pg_hba.conf" >nul
    echo Restored from backup
) else (
    echo Backup not found, restoring manually...
    powershell -Command "(Get-Content '%PG_PATH%\data\pg_hba.conf') -replace 'trust', 'scram-sha-256' | Set-Content '%PG_PATH%\data\pg_hba.conf'"
    echo Modified pg_hba.conf
)
echo.

echo Step 2: Restarting PostgreSQL service...
net stop postgresql-x64-* >nul 2>&1
net stop *postgresql* >nul 2>&1
timeout /t 2 /nobreak >nul

net start postgresql-x64-* >nul 2>&1
net start *postgresql* >nul 2>&1
timeout /t 3 /nobreak >nul
echo PostgreSQL restarted
echo.

echo =====================================
echo Security Restored!
echo =====================================
echo.
echo PostgreSQL now requires password authentication.
echo Test your new password with: psql -U postgres
echo.
pause
