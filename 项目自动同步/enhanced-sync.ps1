# CVTE项目增强自动同步脚本
# 功能：基于配置文件的智能文件监控和自动同步
# 作者：pengzhitan
# 版本：2.0
# 创建时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

param(
    [string]$ConfigPath = "$PSScriptRoot\sync-config.json",
    [switch]$RunOnce = $false,
    [switch]$Verbose = $false
)

# 全局变量
$script:Config = $null
$script:LastSyncTime = Get-Date
$script:SyncCount = 0

# 加载配置文件
function Import-SyncConfig {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        Write-Error "配置文件不存在：$Path"
        return $null
    }
    
    try {
        $configContent = Get-Content $Path -Raw -Encoding UTF8
        $config = $configContent | ConvertFrom-Json
        
        # 验证必要的配置项
        if (-not $config.projectPath -or -not $config.remoteRepo) {
            Write-Error "配置文件缺少必要项：projectPath 或 remoteRepo"
            return $null
        }
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 配置文件加载成功" -ForegroundColor Green
        return $config
    }
    catch {
        Write-Error "配置文件解析失败：$($_.Exception.Message)"
        return $null
    }
}

# 设置Git配置
function Set-GitConfigFromFile {
    param($Config)
    
    if ($Config.gitConfig) {
        $currentName = git config --global user.name
        $currentEmail = git config --global user.email
        
        if (-not $currentName -and $Config.gitConfig.userName) {
            git config --global user.name $Config.gitConfig.userName
            Write-Host "已设置Git用户名：$($Config.gitConfig.userName)" -ForegroundColor Green
        }
        
        if (-not $currentEmail -and $Config.gitConfig.userEmail) {
            git config --global user.email $Config.gitConfig.userEmail
            Write-Host "已设置Git邮箱：$($Config.gitConfig.userEmail)" -ForegroundColor Green
        }
    }
}

# 检查文件是否应该被排除
function Test-ShouldExcludeFile {
    param(
        [string]$FilePath,
        [array]$ExcludePatterns
    )
    
    if (-not $ExcludePatterns) {
        return $false
    }
    
    foreach ($pattern in $ExcludePatterns) {
        if ($FilePath -like $pattern) {
            return $true
        }
    }
    
    return $false
}

# 获取文件变化统计
function Get-FileChangeStats {
    param([string]$Path, $Config)
    
    Push-Location $Path
    try {
        $stats = @{
            Added = @()
            Modified = @()
            Staged = @()
            Total = 0
        }
        
        # 获取未跟踪的文件
        $untrackedFiles = git ls-files --others --exclude-standard
        if ($untrackedFiles) {
            foreach ($file in $untrackedFiles) {
                if (-not (Test-ShouldExcludeFile -FilePath $file -ExcludePatterns $Config.excludePatterns)) {
                    $stats.Added += $file
                }
            }
        }
        
        # 获取已修改的文件
        $modifiedFiles = git diff --name-only
        if ($modifiedFiles) {
            foreach ($file in $modifiedFiles) {
                if (-not (Test-ShouldExcludeFile -FilePath $file -ExcludePatterns $Config.excludePatterns)) {
                    $stats.Modified += $file
                }
            }
        }
        
        # 获取已暂存的文件
        $stagedFiles = git diff --cached --name-only
        if ($stagedFiles) {
            $stats.Staged = $stagedFiles
        }
        
        $stats.Total = $stats.Added.Count + $stats.Modified.Count + $stats.Staged.Count
        
        return $stats
    }
    finally {
        Pop-Location
    }
}

# 显示文件变化详情
function Show-FileChanges {
    param($Stats, [bool]$Verbose)
    
    if ($Stats.Total -eq 0) {
        return
    }
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 检测到 $($Stats.Total) 个文件变化：" -ForegroundColor Cyan
    
    if ($Stats.Added.Count -gt 0) {
        Write-Host "  新增文件：$($Stats.Added.Count) 个" -ForegroundColor Green
        if ($Verbose) {
            $Stats.Added | ForEach-Object { Write-Host "    + $_" -ForegroundColor Green }
        }
    }
    
    if ($Stats.Modified.Count -gt 0) {
        Write-Host "  修改文件：$($Stats.Modified.Count) 个" -ForegroundColor Yellow
        if ($Verbose) {
            $Stats.Modified | ForEach-Object { Write-Host "    ~ $_" -ForegroundColor Yellow }
        }
    }
    
    if ($Stats.Staged.Count -gt 0) {
        Write-Host "  已暂存文件：$($Stats.Staged.Count) 个" -ForegroundColor Blue
        if ($Verbose) {
            $Stats.Staged | ForEach-Object { Write-Host "    * $_" -ForegroundColor Blue }
        }
    }
}

# 生成提交信息
function New-CommitMessage {
    param($Config, $Stats)
    
    $message = $Config.autoCommitMessage.prefix
    
    if ($Config.autoCommitMessage.includeFileCount) {
        $message += " ($($Stats.Total) 个文件)"
    }
    
    if ($Config.autoCommitMessage.includeTimestamp) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $message += " - $timestamp"
    }
    
    return $message
}

# 执行同步操作
function Invoke-EnhancedSync {
    param([string]$Path, $Config, $Stats)
    
    Push-Location $Path
    try {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 开始同步操作..." -ForegroundColor Magenta
        
        # 添加文件
        Write-Host "  正在添加文件..." -ForegroundColor Gray
        git add .
        if ($LASTEXITCODE -ne 0) {
            throw "添加文件失败"
        }
        
        # 检查暂存区
        $stagedChanges = git diff --cached --name-only
        if (-not $stagedChanges) {
            Write-Host "  没有需要提交的变化" -ForegroundColor Gray
            return $true
        }
        
        # 生成提交信息
        $commitMessage = New-CommitMessage -Config $Config -Stats $Stats
        
        # 提交
        Write-Host "  正在提交：$commitMessage" -ForegroundColor Gray
        git commit -m $commitMessage
        if ($LASTEXITCODE -ne 0) {
            throw "提交失败"
        }
        
        # 推送
        Write-Host "  正在推送到远程仓库..." -ForegroundColor Gray
        git push origin master
        if ($LASTEXITCODE -ne 0) {
            # 尝试先拉取
            Write-Host "  尝试先拉取远程更新..." -ForegroundColor Gray
            git pull origin master --rebase
            if ($LASTEXITCODE -eq 0) {
                git push origin master
                if ($LASTEXITCODE -ne 0) {
                    throw "推送仍然失败"
                }
            } else {
                throw "拉取失败，可能存在冲突"
            }
        }
        
        # 更新统计
        $script:SyncCount++
        $script:LastSyncTime = Get-Date
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 同步完成！(第 $script:SyncCount 次)" -ForegroundColor Green
        
        # 显示通知
        if ($Config.notifications.enabled -and $Config.notifications.showSuccess) {
            Write-Host "  ✓ 成功同步 $($Stats.Total) 个文件到 GitHub" -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        Write-Error "同步失败：$($_.Exception.Message)"
        
        if ($Config.notifications.enabled -and $Config.notifications.showErrors) {
            Write-Host "  ✗ 同步失败：$($_.Exception.Message)" -ForegroundColor Red
        }
        
        return $false
    }
    finally {
        Pop-Location
    }
}

# 显示状态信息
function Show-SyncStatus {
    param($Config)
    
    $uptime = (Get-Date) - $script:LastSyncTime
    Write-Host "[状态] 运行时长：$([math]::Floor($uptime.TotalMinutes)) 分钟 | 同步次数：$script:SyncCount | 最后同步：$($script:LastSyncTime.ToString('HH:mm:ss'))" -ForegroundColor DarkGray
}

# 主函数
function Start-EnhancedSync {
    # 加载配置
    $script:Config = Import-SyncConfig -Path $ConfigPath
    if (-not $script:Config) {
        return
    }
    
    Write-Host "=== CVTE项目增强自动同步脚本 v2.0 ===" -ForegroundColor Cyan
    Write-Host "项目路径：$($script:Config.projectPath)" -ForegroundColor White
    Write-Host "远程仓库：$($script:Config.remoteRepo)" -ForegroundColor White
    Write-Host "检查间隔：$($script:Config.checkInterval) 秒" -ForegroundColor White
    Write-Host "运行模式：$(if ($RunOnce) { '单次运行' } else { '持续监控' })" -ForegroundColor White
    Write-Host "详细输出：$(if ($Verbose) { '开启' } else { '关闭' })" -ForegroundColor White
    Write-Host "启动时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host ""
    
    # 设置Git配置
    Set-GitConfigFromFile -Config $script:Config
    
    # 验证项目路径
    if (-not (Test-Path $script:Config.projectPath)) {
        Write-Error "项目路径不存在：$($script:Config.projectPath)"
        return
    }
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 开始监控文件变化..." -ForegroundColor Green
    if (-not $RunOnce) {
        Write-Host "按 Ctrl+C 停止监控" -ForegroundColor Yellow
    }
    Write-Host ""
    
    $statusCounter = 0
    
    do {
        try {
            # 获取文件变化统计
            $stats = Get-FileChangeStats -Path $script:Config.projectPath -Config $script:Config
            
            if ($stats.Total -gt 0) {
                # 显示变化详情
                Show-FileChanges -Stats $stats -Verbose $Verbose
                
                # 执行同步
                $syncResult = Invoke-EnhancedSync -Path $script:Config.projectPath -Config $script:Config -Stats $stats
                Write-Host ""
            } else {
                if ($Verbose) {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 无文件变化" -ForegroundColor Gray
                }
            }
            
            # 每10次检查显示一次状态
            $statusCounter++
            if ($statusCounter -ge 10 -and -not $RunOnce) {
                Show-SyncStatus -Config $script:Config
                $statusCounter = 0
            }
            
            if ($RunOnce) {
                break
            }
            
            Start-Sleep -Seconds $script:Config.checkInterval
        }
        catch {
            Write-Error "监控过程中发生错误：$($_.Exception.Message)"
            if ($RunOnce) {
                break
            }
            Start-Sleep -Seconds $script:Config.checkInterval
        }
    } while ($true)
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 增强自动同步脚本已停止" -ForegroundColor Yellow
}

# 脚本入口点
if ($MyInvocation.InvocationName -ne '.') {
    Start-EnhancedSync
}