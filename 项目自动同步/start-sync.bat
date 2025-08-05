@echo off
chcp 65001 >nul

echo ========================================
echo           CVTE Auto Sync Tool
echo ========================================
echo.
echo Select mode:
echo 1. Monitor mode (recommended)
echo 2. Run once
echo 3. Interactive mode
echo 4. Exit
echo.
set /p choice=Please select (1-4): 

if "%choice%"=="1" (
    echo Starting monitor mode...
    powershell -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Monitor
) else if "%choice%"=="2" (
    echo Running once...
    powershell -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -RunOnce
) else if "%choice%"=="3" (
    echo Starting interactive mode...
    powershell -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1"
) else if "%choice%"=="4" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid option, please try again
    pause
    goto start
)

pause