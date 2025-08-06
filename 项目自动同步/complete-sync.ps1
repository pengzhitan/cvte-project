# CVTE项目自动同步工具
param(
    [switch]$RunOnce = $false,
    [switch]$Monitor = $false,
    [string]$Mode = "",
    [int]$Interval = 0,
    [string]$ConfigPath = "$PSScriptRoot\config.json"
)

# 全局变量
$Config = $null
$LogFile = "$PSScriptRoot\sync.log"

# 加载配置文件
function Load-Config {
    try {
        if (Test-Path $ConfigPath) {
            $global:Config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
            Write-Host "[INFO] 配置文件加载成功" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[ERROR] 配置文件不存在: $ConfigPath" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "[ERROR] 配置文件解析失败: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 日志函数
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    Write-Host $logEntry -ForegroundColor $color
    
    try {
        Add-Content -Path $LogFile -Value $logEntry -Encoding UTF8
    } catch {
        Write-Host "日志写入失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 检测Git仓库
function Test-GitRepository {
    $projectPath = $Config.projectPath
    
    if (-not (Test-Path "$projectPath\.git")) {
        Write-Log "Git仓库不存在: $projectPath" "ERROR"
        return $false
    }
    
    try {
        Set-Location $projectPath
        $currentUser = git config user.name
        $currentEmail = git config user.email
        
        if (-not $currentUser -or -not $currentEmail) {
            Write-Log "设置Git用户信息..." "INFO"
            git config user.name $Config.gitConfig.userName
            git config user.email $Config.gitConfig.userEmail
        }
        
        Write-Log "Git仓库检查通过" "SUCCESS"
        return $true
    } catch {
        Write-Log "Git配置检查失败: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# 获取当前分支
function Get-CurrentBranch {
    try {
        $branch = git rev-parse --abbrev-ref HEAD
        return $branch.Trim()
    } catch {
        Write-Log "获取当前分支失败，使用默认分支main" "WARN"
        return "main"
    }
}

# Git同步函数
function Invoke-GitSync {
    try {
        Set-Location $Config.projectPath
        
        # 检查是否有变化
        $status = git status --porcelain
        if (-not $status) {
            Write-Log "没有检测到文件变化" "INFO"
            return $true
        }
        
        $changedFiles = ($status | Measure-Object).Count
        Write-Log "检测到 $changedFiles 个文件变化，开始同步..." "INFO"
        
        # 添加所有变化
        Write-Log "添加文件到暂存区..." "INFO"
        git add .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "文件添加失败" "ERROR"
            return $false
        }
        
        # 生成提交信息
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = $Config.autoCommitMessage.prefix
        
        if ($Config.autoCommitMessage.includeTimestamp) {
            $commitMessage += " - $timestamp"
        }
        
        if ($Config.autoCommitMessage.includeFileCount) {
            $commitMessage += " ($changedFiles 个文件)"
        }
        
        # 提交变化
        Write-Log "提交变化: $commitMessage" "INFO"
        git commit -m $commitMessage
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "提交失败" "ERROR"
            return $false
        }
        
        # 获取当前分支
        $currentBranch = Get-CurrentBranch
        Write-Log "当前分支: $currentBranch" "INFO"
        
        # 推送到远程
        Write-Log "推送到远程仓库..." "INFO"
        git push origin $currentBranch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "同步完成！" "SUCCESS"
            return $true
        } else {
            Write-Log "推送失败，尝试先拉取..." "WARN"
            
            # 先拉取再推送
            git pull origin $currentBranch --rebase
            
            if ($LASTEXITCODE -eq 0) {
                git push origin $currentBranch
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "同步完成（经过rebase）" "SUCCESS"
                    return $true
                }
            }
            
            Write-Log "同步失败，请手动解决冲突" "ERROR"
            return $false
        }
    } catch {
        Write-Log "同步过程中发生错误: $($_.Exception.Message)" "ERROR"
        return $false
    }
}
}

# 主执行逻辑
try {
    Write-Host "\n=== CVTE 项目自动同步工具 ===" -ForegroundColor Cyan
    
    # 加载配置
    if (-not (Load-Config)) {
        Write-Host "配置加载失败，程序退出" -ForegroundColor Red
        exit 1
    }
    
    # 检查Git仓库
    if (-not (Test-GitRepository)) {
        Write-Host "Git仓库检查失败，程序退出" -ForegroundColor Red
        exit 1
    }
    
    # 根据参数执行不同模式
    if ($RunOnce -or $Mode -eq "once") {
        Write-Log "执行单次同步模式" "INFO"
        $result = Invoke-GitSync
        if ($result) {
            Write-Log "单次同步完成" "SUCCESS"
            Write-Host "\n✅ 同步成功完成！" -ForegroundColor Green
        } else {
            Write-Log "单次同步失败" "ERROR"
            Write-Host "\n❌ 同步失败，请查看日志" -ForegroundColor Red
            exit 1
        }
    } elseif ($Monitor -or $Mode -eq "continuous") {
        Write-Log "启动持续监控模式" "INFO"
        Write-Host "\n🔄 启动持续监控模式..." -ForegroundColor Yellow
        Write-Host "按 Ctrl+C 停止监控" -ForegroundColor Gray
        
        $interval = if ($Interval -gt 0) { $Interval } else { $Config.checkInterval }
        
        while ($true) {
            try {
                $syncResult = Invoke-GitSync
                Start-Sleep -Seconds $interval
            } catch {
                Write-Log "监控过程中发生错误: $($_.Exception.Message)" "ERROR"
                Start-Sleep -Seconds $interval
            }
        }
    } elseif ($Mode -eq "interactive") {
        Write-Log "启动交互模式" "INFO"
        Write-Host "\n🎯 交互模式暂未实现，请使用其他模式" -ForegroundColor Yellow
    } else {
        # 默认显示帮助信息
        Write-Host "\n📖 使用方法:" -ForegroundColor White
        Write-Host "  .\complete-sync.ps1 -Mode once        # 单次同步" -ForegroundColor Gray
        Write-Host "  .\complete-sync.ps1 -Mode continuous  # 持续监控" -ForegroundColor Gray
        Write-Host "  .\complete-sync.ps1 -Mode interactive # 交互模式" -ForegroundColor Gray
        Write-Host "\n或直接运行 一键启动.bat 文件" -ForegroundColor Yellow
    }
    
} catch {
    Write-Log "程序执行过程中发生错误: $($_.Exception.Message)" "ERROR"
    Write-Host "\n❌ 程序执行失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}