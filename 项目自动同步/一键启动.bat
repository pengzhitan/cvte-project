@echo off
chcp 65001 >nul
title Project Auto Sync Tool
color 0A
cd /d "%~dp0"

:start
cls
echo ========================================
echo        Project Auto Sync Tool
echo ========================================
echo.
echo Please select running mode:
echo.
echo [1] Continuous Monitor - Real-time file monitoring and sync
echo [2] Single Sync       - Execute one complete sync
echo [3] Interactive Mode  - Manual sync control
echo [4] Start Web Server  - Launch HTTP server for web UI
echo [5] Open HTML UI      - Open local HTML file (legacy)
echo [6] View Config       - Edit sync configuration
echo [0] Exit
echo.
set /p choice=Please enter option (0-6): 

if "%choice%"=="1" goto monitor
if "%choice%"=="2" goto once
if "%choice%"=="3" goto interactive
if "%choice%"=="4" goto webserver
if "%choice%"=="5" goto html
if "%choice%"=="6" goto config
if "%choice%"=="0" goto exit
echo Invalid option, please try again
pause
goto start

:monitor
echo.
echo Starting continuous monitor mode...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Mode continuous
goto end

:once
echo.
echo Executing single sync...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Mode once
goto end

:interactive
echo.
echo Starting interactive mode...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Mode interactive
goto end

:webserver
echo.
echo Starting HTTP server for web interface...
echo Server will be available at: http://localhost:8080
echo Press Ctrl+C to stop the server
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0sync-server.ps1"
goto start

:html
echo.
echo Opening HTML interface...
start "" "%~dp0sync-launcher.html"
echo HTML interface opened in browser
pause
goto start

:config
echo.
echo Opening configuration file...
if exist "%~dp0config.json" (
    start "" "%~dp0config.json"
    echo Configuration file opened
) else (
    echo Configuration file not found
)
pause
goto start

:end
echo.
echo Operation completed!
echo Press any key to return to main menu...
pause >nul
goto start

:exit
echo.
echo Thank you for using Project Auto Sync Tool!
echo Press any key to exit...
pause >nul
exit