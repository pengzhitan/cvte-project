@echo off
chcp 65001 >nul
title CVTE Project Auto Sync Tool
cd /d "%~dp0"
echo Starting CVTE Project Auto Sync Tool...
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Mode interactive
pause