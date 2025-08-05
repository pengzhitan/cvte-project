# Windows任务计划程序配置脚本
# 功能：设置CVTE项目自动同步为开机自启动服务
# 作者：pengzhitan
# 创建时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Status,
    [string]$TaskName = "CVTE-AutoSync",
    [string]$ScriptPath = "$PSScriptRoot\enhanced-sync.ps1"
)

# 检查管理员权限
function Test-AdminRights {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 安装自启动任务
function Install-AutoStartTask {
    param(
        [string]$TaskName,
        [string]$ScriptPath
    )
    
    try {
        Write-Host "正在创建自启动任务：$TaskName" -ForegroundColor Yellow
        
        # 检查脚本文件是否存在
        if (-not (Test-Path $ScriptPath)) {
            throw "脚本文件不存在：$ScriptPath"
        }
        
        # 创建任务操作
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$ScriptPath`""
        
        # 创建触发器（开机启动，延迟2分钟）
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $trigger.Delay = "PT2M"  # 延迟2分钟启动
        
        # 创建任务设置
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
        $settings.ExecutionTimeLimit = "PT0S"  # 无时间限制
        $settings.RestartCount = 3
        $settings.RestartInterval = "PT1M"
        
        # 创建任务主体（以当前用户身份运行）
        $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
        
        # 注册任务
        Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "CVTE项目自动同步服务" -Force
        
        Write-Host "✅ 自启动任务创建成功！" -ForegroundColor Green
        Write-Host "任务名称：$TaskName" -ForegroundColor White
        Write-Host "脚本路径：$ScriptPath" -ForegroundColor White
        Write-Host "启动方式：开机自动启动（延迟2分钟）" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 提示：" -ForegroundColor Cyan
        Write-Host "- 任务将在下次重启后自动运行" -ForegroundColor Gray
        Write-Host "- 可以通过 '任务计划程序' 管理此任务" -ForegroundColor Gray
        Write-Host "- 使用 -Status 参数查看任务状态" -ForegroundColor Gray
        
        return $true
    }
    catch {
        Write-Error "创建自启动任务失败：$($_.Exception.Message)"
        return $false
    }
}

# 卸载自启动任务
function Uninstall-AutoStartTask {
    param([string]$TaskName)
    
    try {
        Write-Host "正在删除自启动任务：$TaskName" -ForegroundColor Yellow
        
        # 检查任务是否存在
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if (-not $task) {
            Write-Host "⚠️ 任务不存在：$TaskName" -ForegroundColor Yellow
            return $true
        }
        
        # 停止任务（如果正在运行）
        Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        
        # 删除任务
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        
        Write-Host "✅ 自启动任务删除成功！" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "删除自启动任务失败：$($_.Exception.Message)"
        return $false
    }
}

# 查看任务状态
function Get-AutoStartTaskStatus {
    param([string]$TaskName)
    
    try {
        Write-Host "=== 自启动任务状态 ===" -ForegroundColor Cyan
        
        $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        if (-not $task) {
            Write-Host "❌ 任务不存在：$TaskName" -ForegroundColor Red
            Write-Host "使用 -Install 参数创建自启动任务" -ForegroundColor Gray
            return
        }
        
        $taskInfo = Get-ScheduledTaskInfo -TaskName $TaskName
        
        Write-Host "任务名称：$($task.TaskName)" -ForegroundColor White
        Write-Host "任务状态：$($task.State)" -ForegroundColor $(if ($task.State -eq 'Ready') { 'Green' } elseif ($task.State -eq 'Running') { 'Yellow' } else { 'Red' })
        Write-Host "描述信息：$($task.Description)" -ForegroundColor White
        Write-Host "最后运行：$($taskInfo.LastRunTime)" -ForegroundColor White
        Write-Host "下次运行：$($taskInfo.NextRunTime)" -ForegroundColor White
        Write-Host "最后结果：$($taskInfo.LastTaskResult)" -ForegroundColor $(if ($taskInfo.LastTaskResult -eq 0) { 'Green' } else { 'Red' })
        
        # 显示触发器信息
        Write-Host "\n触发器信息：" -ForegroundColor Cyan
        foreach ($trigger in $task.Triggers) {
            Write-Host "  类型：$($trigger.CimClass.CimClassName)" -ForegroundColor Gray
            if ($trigger.Delay) {
                Write-Host "  延迟：$($trigger.Delay)" -ForegroundColor Gray
            }
        }
        
        # 显示操作信息
        Write-Host "\n操作信息：" -ForegroundColor Cyan
        foreach ($action in $task.Actions) {
            Write-Host "  程序：$($action.Execute)" -ForegroundColor Gray
            Write-Host "  参数：$($action.Arguments)" -ForegroundColor Gray
        }
        
        # 显示管理建议
        Write-Host "\n💡 管理建议：" -ForegroundColor Cyan
        Write-Host "- 启动任务：Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
        Write-Host "- 停止任务：Stop-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
        Write-Host "- 删除任务：.\setup-auto-start.ps1 -Uninstall" -ForegroundColor Gray
        Write-Host "- 查看日志：Get-WinEvent -LogName 'Microsoft-Windows-TaskScheduler/Operational' | Where-Object {$_.Message -like '*$TaskName*'}" -ForegroundColor Gray
        
    }
    catch {
        Write-Error "获取任务状态失败：$($_.Exception.Message)"
    }
}

# 显示帮助信息
function Show-Help {
    Write-Host "=== CVTE项目自启动配置工具 ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法：" -ForegroundColor Yellow
    Write-Host "  .\setup-auto-start.ps1 -Install     # 安装自启动任务" -ForegroundColor White
    Write-Host "  .\setup-auto-start.ps1 -Uninstall  # 卸载自启动任务" -ForegroundColor White
    Write-Host "  .\setup-auto-start.ps1 -Status     # 查看任务状态" -ForegroundColor White
    Write-Host ""
    Write-Host "参数说明：" -ForegroundColor Yellow
    Write-Host "  -TaskName    任务名称（默认：CVTE-AutoSync）" -ForegroundColor Gray
    Write-Host "  -ScriptPath  脚本路径（默认：当前目录下的enhanced-sync.ps1）" -ForegroundColor Gray
    Write-Host ""
    Write-Host "示例：" -ForegroundColor Yellow
    Write-Host "  # 使用自定义任务名称安装" -ForegroundColor Gray
    Write-Host "  .\setup-auto-start.ps1 -Install -TaskName 'MyAutoSync'" -ForegroundColor White
    Write-Host ""
    Write-Host "  # 使用自定义脚本路径安装" -ForegroundColor Gray
    Write-Host "  .\setup-auto-start.ps1 -Install -ScriptPath 'C:\Scripts\my-sync.ps1'" -ForegroundColor White
    Write-Host ""
    Write-Host "注意事项：" -ForegroundColor Yellow
    Write-Host "- 需要管理员权限来创建/删除任务计划" -ForegroundColor Red
    Write-Host "- 任务将在开机后延迟2分钟启动" -ForegroundColor Gray
    Write-Host "- 任务以当前用户身份运行" -ForegroundColor Gray
    Write-Host "- 支持网络连接检查和自动重启" -ForegroundColor Gray
}

# 主函数
function Main {
    Write-Host "CVTE项目自启动配置工具" -ForegroundColor Cyan
    Write-Host "当前时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""
    
    # 检查参数
    if (-not ($Install -or $Uninstall -or $Status)) {
        Show-Help
        return
    }
    
    # 检查管理员权限（安装和卸载需要）
    if (($Install -or $Uninstall) -and -not (Test-AdminRights)) {
        Write-Error "此操作需要管理员权限，请以管理员身份运行PowerShell"
        Write-Host "\n💡 解决方案：" -ForegroundColor Cyan
        Write-Host "1. 右键点击PowerShell图标" -ForegroundColor Gray
        Write-Host "2. 选择 '以管理员身份运行'" -ForegroundColor Gray
        Write-Host "3. 重新执行此脚本" -ForegroundColor Gray
        return
    }
    
    # 执行相应操作
    if ($Install) {
        $result = Install-AutoStartTask -TaskName $TaskName -ScriptPath $ScriptPath
        if ($result) {
            Write-Host "\n🎉 安装完成！下次重启后将自动开始同步。" -ForegroundColor Green
        }
    }
    elseif ($Uninstall) {
        $result = Uninstall-AutoStartTask -TaskName $TaskName
        if ($result) {
            Write-Host "\n🎉 卸载完成！自启动任务已删除。" -ForegroundColor Green
        }
    }
    elseif ($Status) {
        Get-AutoStartTaskStatus -TaskName $TaskName
    }
}

# 脚本入口点
if ($MyInvocation.InvocationName -ne '.') {
    Main
}