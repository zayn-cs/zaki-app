@echo off
echo ========================================
echo   Systeme d'Archivage - Development mode
echo ========================================

cd /d "%~dp0"

echo.
echo [0/2] Cleaning up previous processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo.
echo [1/2] Building and starting API server...
cd artifacts\api-server
call node build.mjs
start "API Server" /B node dist\index.mjs
cd ..\..

echo.
echo [2/2] Starting local Vite Dev Server...
echo ========================================
echo   API Server running at http://localhost:3002
echo   Vite frontend will launch shortly...
echo ========================================
cd artifacts\archivage-app
call npx vite --port 3000