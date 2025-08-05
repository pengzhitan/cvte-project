@echo off
cd /d "%~dp0"
chcp 65001 >nul
cls

echo ========================================
echo           CVTE 项目自动同步工具
echo ========================================
echo.
echo 请选择运行模式：
echo 1. 持续监控模式（推荐）
echo 2. 单次同步
echo 3. 交互模式
echo 4. 退出
echo.
set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" (
    echo 启动持续监控模式...
    powershell -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Monitor
) else if "%choice%"=="2" (
    echo 执行单次同步...
    powershell -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -RunOnce
) else if "%choice%"=="3" (
    echo 启动交互模式...
    powershell -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1"
) else if "%choice%"=="4" (
    echo 退出程序
    exit /b 0
) else (
    echo 无效选项，请重新选择
    pause
    goto :eof
)

echo.
echo 按任意键关闭窗口...
pause >nul