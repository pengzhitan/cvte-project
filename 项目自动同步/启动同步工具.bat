@echo off
chcp 65001 >nul
echo Starting project auto-sync tool...
echo.

rem Get current script directory
set "SCRIPT_DIR=%~dp0"

rem Launch HTML interface
start "" "%SCRIPT_DIR%sync-launcher.html"

echo Sync tool interface has been launched!
echo Please operate sync functions in the browser.
echo.
pause