@echo off
REM Docker Commands for Time Tracking System (Windows)
REM Alternative to Makefile for Windows users

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="restart" goto restart
if "%1"=="logs" goto logs
if "%1"=="build" goto build
if "%1"=="clean" goto clean
if "%1"=="dev" goto dev
if "%1"=="status" goto status
if "%1"=="health" goto health
if "%1"=="backup" goto backup
goto help

:help
echo Time Tracking System - Docker Commands
echo ========================================
echo.
echo Usage: docker-commands.bat [command]
echo.
echo Commands:
echo   help      Show this help message
echo   start     Start the application
echo   stop      Stop the application
echo   restart   Restart the application
echo   logs      View application logs
echo   build     Rebuild and start
echo   clean     Stop and remove containers
echo   dev       Start in development mode
echo   status    Show container status
echo   health    Check application health
echo   backup    Create database backup
echo.
goto end

:start
echo Starting application...
docker-compose up -d
echo.
echo [OK] Application started!
echo Access at: http://localhost:3000
goto end

:stop
echo Stopping application...
docker-compose down
echo [OK] Application stopped
goto end

:restart
echo Restarting application...
docker-compose restart
echo [OK] Application restarted
goto end

:logs
echo Viewing logs (Press Ctrl+C to exit)...
docker-compose logs -f
goto end

:build
echo Rebuilding and starting application...
docker-compose up -d --build
echo [OK] Application rebuilt and started
goto end

:clean
echo Stopping and removing containers...
docker-compose down
echo [OK] Containers removed (data preserved)
goto end

:dev
echo Starting development environment...
docker-compose -f docker-compose.dev.yml up -d
echo.
echo [OK] Development environment started!
echo Access at: http://localhost:3000
goto end

:status
echo Container Status:
echo.
docker-compose ps
goto end

:health
echo Checking application health...
curl -s http://localhost:3000/api/health
echo.
goto end

:backup
echo Creating database backup...
docker exec timetrack-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -Q "BACKUP DATABASE TimeTrackDB TO DISK = '/var/opt/mssql/backup/TimeTrackDB.bak'"
echo [OK] Backup created in container
goto end

:end

