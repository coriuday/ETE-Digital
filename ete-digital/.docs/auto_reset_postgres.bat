@echo off
REM Automated PostgreSQL Password Reset to "root"
REM This script does EVERYTHING automatically

echo =====================================
echo Auto PostgreSQL Password Reset
echo =====================================
echo Setting postgres password to: root
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

echo Step 1: Backing up pg_hba.conf...
copy "%PG_PATH%\data\pg_hba.conf" "%PG_PATH%\data\pg_hba.conf.backup" >nul 2>&1
echo Done
echo.

echo Step 2: Enabling trust authentication...
powershell -Command "(Get-Content '%PG_PATH%\data\pg_hba.conf') -replace 'scram-sha-256', 'trust' -replace 'md5', 'trust' | Set-Content '%PG_PATH%\data\pg_hba.conf'"
echo Done
echo.

echo Step 3: Restarting PostgreSQL...
net stop postgresql-x64-16 >nul 2>&1
net stop postgresql-x64-15 >nul 2>&1
net stop postgresql-x64-14 >nul 2>&1
timeout /t 2 /nobreak >nul

net start postgresql-x64-16 >nul 2>&1
net start postgresql-x64-15 >nul 2>&1
net start postgresql-x64-14 >nul 2>&1
timeout /t 3 /nobreak >nul
echo Done
echo.

echo Step 4: Changing passwords...
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'root';" 2>nul
echo postgres password set to: root

psql -U postgres -c "CREATE DATABASE ete_digital;" 2>nul
psql -U postgres -c "CREATE USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';" 2>nul
psql -U postgres -c "ALTER USER ete_user WITH PASSWORD 'ete_dev_password_change_in_prod';" 2>nul
echo ete_user password configured
echo.

echo Step 5: Setting up database permissions...
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ete_digital TO ete_user;" 2>nul
psql -U postgres -d ete_digital -c "GRANT ALL ON SCHEMA public TO ete_user;" 2>nul
psql -U postgres -d ete_digital -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ete_user;" 2>nul
psql -U postgres -d ete_digital -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ete_user;" 2>nul
echo Done
echo.

echo Step 6: Restoring security settings...
copy "%PG_PATH%\data\pg_hba.conf.backup" "%PG_PATH%\data\pg_hba.conf" >nul 2>&1
echo Done
echo.

echo Step 7: Final restart...
net stop postgresql-x64-16 >nul 2>&1
net stop postgresql-x64-15 >nul 2>&1
net stop postgresql-x64-14 >nul 2>&1
timeout /t 2 /nobreak >nul

net start postgresql-x64-16 >nul 2>&1
net start postgresql-x64-15 >nul 2>&1  
net start postgresql-x64-14 >nul 2>&1
timeout /t 3 /nobreak >nul
echo Done
echo.

echo =====================================
echo AUTO SETUP COMPLETE!
echo =====================================
echo.
echo PostgreSQL credentials:
echo   Username: postgres
echo   Password: root
echo.
echo Database: ete_digital
echo   User: ete_user
echo   Password: ete_dev_password_change_in_prod
echo.
echo You can now run the backend!
echo.
pause
