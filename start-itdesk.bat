@echo off
title ITDesk v4 - Launcher
color 0A
cls

echo.
echo  ================================================
echo   ITDesk v4 - One Click Launcher
echo  ================================================
echo.

:: ── Move to a safe working folder (NOT inside IIS/wwwroot) ──
set WORKDIR=C:\ITDesk
if not exist "%WORKDIR%" mkdir "%WORKDIR%"

:: ── Copy all files to safe folder ──
copy /Y "%~dp0server.js"    "%WORKDIR%\server.js"    >nul
copy /Y "%~dp0webserver.js" "%WORKDIR%\webserver.js" >nul
copy /Y "%~dp0index.html"   "%WORKDIR%\index.html"   >nul

cd /d "%WORKDIR%"

echo  [INFO] Working folder: %WORKDIR%

:: ── Check Node.js ──
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  [ERROR] Node.js not installed.
    echo  Download: https://nodejs.org
    pause & exit /b 1
)
FOR /F "tokens=*" %%i IN ('node --version') DO SET NODE_VER=%%i
echo  [OK]   Node.js %NODE_VER%

:: ── Install npm packages if needed ──
IF NOT EXIST "%WORKDIR%\node_modules\express" (
    echo  [INFO] Installing packages into %WORKDIR%...
    cd /d "%WORKDIR%"
    call npm install nodemailer express cors
    IF %ERRORLEVEL% NEQ 0 (
        color 0C
        echo.
        echo  [ERROR] npm install failed.
        echo  Try: Right-click start-itdesk.bat and choose
        echo       "Run as Administrator"
        echo.
        pause & exit /b 1
    )
    echo  [OK]   Packages installed
) ELSE (
    echo  [OK]   Packages already installed
)

:: ── Kill anything on port 8040 or 8888 ──
FOR /F "tokens=5" %%a IN ('netstat -aon 2^>nul ^| find ":8040" ^| find "LISTENING"') DO taskkill /PID %%a /F >nul 2>&1
FOR /F "tokens=5" %%a IN ('netstat -aon 2^>nul ^| find ":8888" ^| find "LISTENING"') DO taskkill /PID %%a /F >nul 2>&1
timeout /t 1 >nul

:: ── Firewall rules ──
netsh advfirewall firewall add rule name="ITDesk Mailer 8040" dir=in action=allow protocol=TCP localport=8040 >nul 2>&1
netsh advfirewall firewall add rule name="ITDesk Web 8888"    dir=in action=allow protocol=TCP localport=8888 >nul 2>&1

:: ── Start SMTP Mailer (minimized) ──
echo  [INFO] Starting ITDesk Mailer on port 8040...
start "ITDesk Mailer" /min cmd /c "cd /d %WORKDIR% && node server.js"
timeout /t 2 >nul

:: ── Start Web Server (minimized) ──
echo  [INFO] Starting Web Server on port 8888...
start "ITDesk WebSrv" /min cmd /c "cd /d %WORKDIR% && node webserver.js"
timeout /t 2 >nul

:: ── Open browser ──
echo  [INFO] Opening ITDesk in browser...
start "" http://localhost:8888

echo.
echo  ================================================
echo   ITDesk v4 is running!
echo.
echo   ITDesk URL : http://localhost:8888
echo   Mailer URL : http://localhost:8040/send
echo   Files at   : %WORKDIR%
echo.
echo   Press any key to STOP everything.
echo  ================================================
echo.
pause

:: ── Cleanup ──
taskkill /FI "WINDOWTITLE eq ITDesk Mailer*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq ITDesk WebSrv*" /F >nul 2>&1
echo  Stopped.
