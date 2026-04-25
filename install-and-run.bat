@echo off
setlocal EnableDelayedExpansion

title Systeme d'Archivage - Lancement Local

echo ============================================================
echo   Systeme d'Archivage - Installation et Demarrage
echo ============================================================
echo.

:: ---- Verify Node.js ----
where node >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installe.
    echo Veuillez telecharger et installer Node.js depuis https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js detecte : %NODE_VER%

:: ---- Install or update pnpm ----
where pnpm >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installation de pnpm via npm...
    call npm install -g pnpm
    if errorlevel 1 (
        echo [ERREUR] Impossible d'installer pnpm.
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%v in ('pnpm -v') do set PNPM_VER=%%v
echo [OK] pnpm detecte : %PNPM_VER%

:: ---- Install dependencies ----
echo.
echo [INFO] Installation des dependances (pnpm install)...
call pnpm install
if errorlevel 1 (
    echo [ERREUR] pnpm install a echoue.
    pause
    exit /b 1
)
echo [OK] Dependances installees.

:: ---- Build API server ----
echo.
echo [INFO] Compilation du serveur API...
cd artifacts\api-server
call pnpm run build
if errorlevel 1 (
    echo [ERREUR] La compilation du serveur API a echoue.
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo [OK] Serveur API compile.

:: ---- Build frontend (production) ----
echo.
echo [INFO] Compilation de l'interface web...
cd artifacts\archivage-app
set PORT=3000
set BASE_PATH=/
call pnpm run build
if errorlevel 1 (
    echo [ERREUR] La compilation de l'interface web a echoue.
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo [OK] Interface web compilee.

:: ---- Determine project root for SQLite DB ----
set PROJECT_ROOT=%~dp0
set SQLITE_FILE=%PROJECT_ROOT%archivage.db

echo.
echo [INFO] La base de donnees SQLite sera stockee dans :
echo        %SQLITE_FILE%
echo.

:: ---- Launch API server (serves both API and frontend) ----
echo [INFO] Demarrage du serveur sur le port 8080...
echo [INFO] (API + Interface web integree)
start "Serveur - Archivage" cmd /k "cd /d %PROJECT_ROOT%artifacts\api-server && set NODE_ENV=development && set PORT=8080 && set SESSION_SECRET=local-dev-secret-change-me && set SQLITE_PATH=%SQLITE_FILE% && node --enable-source-maps ./dist/index.mjs"

:: ---- Wait for server to start ----
echo [INFO] Attente du demarrage du serveur...
timeout /t 3 /nobreak >nul

:: ---- Open browser ----
echo [INFO] Ouverture du navigateur...
start "" "http://localhost:8080"

:: ---- Done ----
echo.
echo ============================================================
echo   Application lancee avec succes !
echo.
echo   Adresse : http://localhost:8080
echo   Base de donnees : %SQLITE_FILE%
echo.
echo   Identifiants par defaut : admin / admin123
echo.
echo   Fermez la fenetre du terminal pour arreter.
echo ============================================================
echo.
pause
endlocal
