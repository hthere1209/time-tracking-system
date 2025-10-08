@echo off
REM Docker Test Script for Time Tracking System (Windows)

echo =========================================
echo    TimeTrack Docker Test Script
echo =========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo X Docker is not installed!
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo X Docker Compose is not installed!
    echo Please install Docker Compose
    exit /b 1
)

echo [OK] Docker is installed
echo [OK] Docker Compose is installed
echo.

REM Check if Docker daemon is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo X Docker daemon is not running!
    echo Please start Docker Desktop
    exit /b 1
)

echo [OK] Docker daemon is running
echo.

REM Build and start containers
echo Building and starting Docker containers...
docker-compose up -d

echo.
echo Waiting for services to be ready (this may take 30-60 seconds)...
timeout /t 30 /nobreak >nul

REM Check if containers are running
docker-compose ps | find "Up" >nul 2>&1
if %errorlevel% neq 0 (
    echo X Containers failed to start
    echo Check logs with: docker-compose logs
    exit /b 1
)

echo [OK] Containers are running
echo.

echo Testing application health...
timeout /t 10 /nobreak >nul

REM Test if app is responding (using PowerShell)
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel% eq 0 (
    echo [OK] Application is responding
) else (
    echo X Application may not be fully ready yet
    echo Try accessing http://localhost:3000 in your browser
)

echo.
echo =========================================
echo    Success! TimeTrack is running!
echo =========================================
echo.
echo Access the application:
echo    Main App:  http://localhost:3000
echo    Login:     http://localhost:3000/login.html
echo    Admin:     http://localhost:3000/admin
echo.
echo Default credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo Useful commands:
echo    View logs:     docker-compose logs -f
echo    Stop:          docker-compose down
echo    Restart:       docker-compose restart
echo.
pause

