@echo off
chcp 65001 >nul
echo ====================================
echo    CVTE项目自动同步启动器
echo ====================================
echo.
echo 选择运行模式：
echo 1. 持续监控模式（推荐）
echo 2. 单次同步模式
echo 3. 查看帮助信息
echo 4. 退出
echo.
set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" (
    echo.
    echo 启动持续监控模式...
    echo 提示：按 Ctrl+C 可停止监控
    echo.
    powershell -ExecutionPolicy Bypass -File "%~dp0auto-sync.ps1"
) else if "%choice%"=="2" (
    echo.
    echo 执行单次同步...
    echo.
    powershell -ExecutionPolicy Bypass -File "%~dp0auto-sync.ps1" -RunOnce
) else if "%choice%"=="3" (
    echo.
    echo ====================================
    echo           使用说明
    echo ====================================
    echo.
    echo 1. 持续监控模式：
    echo    - 每30秒检查一次文件变化
    echo    - 自动提交并推送到GitHub
    echo    - 适合开发过程中使用
    echo.
    echo 2. 单次同步模式：
    echo    - 立即检查并同步一次
    echo    - 适合手动触发同步
    echo.
    echo 3. 配置文件：
    echo    - sync-config.json: 修改同步参数
    echo    - 可自定义检查间隔、排除文件等
    echo.
    echo 4. 日志文件：
    echo    - 同步日志会显示在控制台
    echo    - 包含详细的操作记录
    echo.
    echo 5. 注意事项：
    echo    - 确保Git已正确配置
    echo    - 确保有GitHub仓库的推送权限
    echo    - 建议先手动测试Git推送
    echo.
    pause
    goto :start
) else if "%choice%"=="4" (
    echo 再见！
    exit /b 0
) else (
    echo 无效选项，请重新选择
    echo.
    goto :start
)

:start
echo.
echo 按任意键返回主菜单...
pause >nul
cls
goto :eof