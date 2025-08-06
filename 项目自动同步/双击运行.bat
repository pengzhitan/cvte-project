@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Starting CVTE Project Auto Sync Tool...
echo.
powershell.exe -ExecutionPolicy Bypass -File ".\complete-sync.ps1"
echo.
echo Press any key to exit...
pause >nul