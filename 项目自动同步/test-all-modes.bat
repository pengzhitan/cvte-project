@echo off
chcp 65001 >nul
echo ========================================
echo CVTE Project Auto Sync - Test All Modes
echo ========================================
echo.

echo [1] Testing Single Sync Mode...
echo ----------------------------------------
powershell -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -RunOnce
echo.
echo Single sync mode test completed.
echo.

echo [2] Testing Git Status Check...
echo ----------------------------------------
cd /d "D:\my-project\CVTE"
git status
echo.
echo Git status check completed.
echo.

echo [3] Testing Remote Connection...
echo ----------------------------------------
git remote -v
echo.
echo Remote connection test completed.
echo.

echo [4] Testing Branch Information...
echo ----------------------------------------
git branch -a
echo.
echo Branch information test completed.
echo.

echo ========================================
echo All tests completed!
echo ========================================
echo.
echo Note: Monitor mode requires manual testing
echo To test monitor mode, run:
echo powershell -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Monitor
echo.
pause