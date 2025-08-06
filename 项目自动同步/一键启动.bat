@echo off
chcp 65001 >nul
title CVTE项目自动同步工具
color 0A
cd /d "%~dp0"

:start
cls
echo ╔══════════════════════════════════════╗
echo ║        CVTE 项目自动同步工具         ║
echo ╚══════════════════════════════════════╝
echo.
echo 🚀 快速启动选项:
echo.
echo [1] 🔄 持续监控模式 - 实时监控文件变化并自动同步
echo [2] ⚡ 单次同步     - 立即执行一次完整同步
echo [3] 🎛️ 交互模式     - 进入完整功能菜单
echo [4] ⚙️ 编辑配置     - 修改同步配置文件
echo [0] 🚪 退出
echo.
set /p choice=请输入选项 (0-4): 

if "%choice%"=="1" goto monitor
if "%choice%"=="2" goto once
if "%choice%"=="3" goto interactive
if "%choice%"=="4" goto config
if "%choice%"=="0" goto exit
echo 无效选项，请重新选择
pause
goto start

:monitor
echo.
echo 🔄 启动持续监控模式...
echo 💡 提示: 按 Ctrl+C 可停止监控
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Mode continuous
goto end

:once
echo.
echo ⚡ 执行单次同步...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Mode once
goto end

:interactive
echo.
echo 🎛️ 启动交互模式...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0complete-sync.ps1" -Mode interactive
goto start

:config
echo.
echo ⚙️ 打开配置文件...
if exist "%~dp0config.json" (
    start "" "%~dp0config.json"
    echo 配置文件已打开，修改后请重启程序
) else (
    echo 配置文件不存在
)
pause
goto start

:end
echo.
echo ✅ 操作完成！
echo 按任意键返回主菜单...
pause >nul
goto start

:exit
echo.
echo 👋 感谢使用 CVTE 项目自动同步工具！
echo 按任意键退出...
pause >nul
exit