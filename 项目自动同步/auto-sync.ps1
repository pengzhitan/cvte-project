# CVTE项目自动同步脚本
# 功能：监控项目文件变化，自动提交并推送到GitHub
# 作者：pengzhitan
# 创建时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

param(
    [string]$ProjectPath = "D:\my-project\CVTE",
    [string]$RemoteRepo = "https://github.com/pengzhitan/cvte-project.git",
    [int]$CheckInterval = 30,  # 检查间隔（秒）
    [switch]$RunOnce = $false  # 是否只运行一次
)

# 配置Git用户信息（如果未配置）
function Set-GitConfig {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 检查Git配置..." -ForegroundColor Yellow
    
    $userName = git config --global user.name
    $userEmail = git config --global user.email
    
    if (-not $userName) {
        git config --global user.name "pengzhitan"
        Write-Host "已设置Git用户名：pengzhitan" -ForegroundColor Green
    }
    
    if (-not $userEmail) {
        git config --global user.email "pzt_china@163.com"
        Write-Host "已设置Git邮箱：pzt_china@163.com" -ForegroundColor Green
    }
}

# 检查项目目录是否为Git仓库
function Test-GitRepository {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        Write-Error "项目路径不存在：$Path"
        return $false
    }
    
    Push-Location $Path
    try {
        $gitStatus = git status 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "当前目录不是Git仓库：$Path"
            return $false
        }
        return $true
    }
    finally {
        Pop-Location
    }
}

# 检查是否有文件变化
function Test-FileChanges {
    param([string]$Path)
    
    Push-Location $Path
    try {
        # 检查未跟踪的文件
        $untrackedFiles = git ls-files --others --exclude-standard
        
        # 检查已修改的文件
        $modifiedFiles = git diff --name-only
        
        # 检查已暂存的文件
        $stagedFiles = git diff --cached --name-only
        
        $hasChanges = ($untrackedFiles.Count -gt 0) -or ($modifiedFiles.Count -gt 0) -or ($stagedFiles.Count -gt 0)
        
        if ($hasChanges) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 检测到文件变化：" -ForegroundColor Cyan
            if ($untrackedFiles) {
                Write-Host "  新增文件：$($untrackedFiles.Count) 个" -ForegroundColor Green
                $untrackedFiles | ForEach-Object { Write-Host "    + $_" -ForegroundColor Green }
            }
            if ($modifiedFiles) {
                Write-Host "  修改文件：$($modifiedFiles.Count) 个" -ForegroundColor Yellow
                $modifiedFiles | ForEach-Object { Write-Host "    ~ $_" -ForegroundColor Yellow }
            }
            if ($stagedFiles) {
                Write-Host "  已暂存文件：$($stagedFiles.Count) 个" -ForegroundColor Blue
                $stagedFiles | ForEach-Object { Write-Host "    * $_" -ForegroundColor Blue }
            }
        }
        
        return $hasChanges
    }
    finally {
        Pop-Location
    }
}

# 执行Git同步操作
function Invoke-GitSync {
    param([string]$Path)
    
    Push-Location $Path
    try {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 开始同步操作..." -ForegroundColor Magenta
        
        # 1. 添加所有变化的文件
        Write-Host "  正在添加文件..." -ForegroundColor Gray
        git add .
        if ($LASTEXITCODE -ne 0) {
            Write-Error "添加文件失败"
            return $false
        }
        
        # 2. 检查是否有需要提交的内容
        $stagedChanges = git diff --cached --name-only
        if (-not $stagedChanges) {
            Write-Host "  没有需要提交的变化" -ForegroundColor Gray
            return $true
        }
        
        # 3. 生成提交信息
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "feat: 自动同步项目文件 - $timestamp"
        
        # 4. 提交变化
        Write-Host "  正在提交变化..." -ForegroundColor Gray
        git commit -m $commitMessage
        if ($LASTEXITCODE -ne 0) {
            Write-Error "提交失败"
            return $false
        }
        
        # 5. 推送到远程仓库
        Write-Host "  正在推送到远程仓库..." -ForegroundColor Gray
        git push origin master
        if ($LASTEXITCODE -ne 0) {
            Write-Error "推送失败，可能需要先拉取远程更新"
            
            # 尝试先拉取再推送
            Write-Host "  尝试先拉取远程更新..." -ForegroundColor Gray
            git pull origin master --rebase
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  重新推送..." -ForegroundColor Gray
                git push origin master
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "推送仍然失败"
                    return $false
                }
            } else {
                Write-Error "拉取失败，请手动解决冲突"
                return $false
            }
        }
        
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 同步完成！" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Error "同步过程中发生错误：$($_.Exception.Message)"
        return $false
    }
    finally {
        Pop-Location
    }
}

# 主函数
function Start-AutoSync {
    Write-Host "=== CVTE项目自动同步脚本 ===" -ForegroundColor Cyan
    Write-Host "项目路径：$ProjectPath" -ForegroundColor White
    Write-Host "远程仓库：$RemoteRepo" -ForegroundColor White
    Write-Host "检查间隔：$CheckInterval 秒" -ForegroundColor White
    Write-Host "运行模式：$(if ($RunOnce) { '单次运行' } else { '持续监控' })" -ForegroundColor White
    Write-Host "启动时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    
    # 初始化Git配置
    Set-GitConfig
    
    # 验证Git仓库
    if (-not (Test-GitRepository -Path $ProjectPath)) {
        Write-Error "项目初始化失败，请检查路径和Git仓库状态"
        return
    }
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 开始监控文件变化..." -ForegroundColor Green
    Write-Host "按 Ctrl+C 停止监控" -ForegroundColor Yellow
    Write-Host ""
    
    do {
        try {
            # 检查文件变化
            if (Test-FileChanges -Path $ProjectPath) {
                # 执行同步
                $syncResult = Invoke-GitSync -Path $ProjectPath
                if ($syncResult) {
                    Write-Host "" -ForegroundColor White
                } else {
                    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 同步失败，将在下次检查时重试" -ForegroundColor Red
                    Write-Host "" -ForegroundColor White
                }
            } else {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 无文件变化" -ForegroundColor Gray
            }
            
            # 如果是单次运行模式，直接退出
            if ($RunOnce) {
                break
            }
            
            # 等待下次检查
            Start-Sleep -Seconds $CheckInterval
        }
        catch {
            Write-Error "监控过程中发生错误：$($_.Exception.Message)"
            if ($RunOnce) {
                break
            }
            Start-Sleep -Seconds $CheckInterval
        }
    } while ($true)
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 自动同步脚本已停止" -ForegroundColor Yellow
}

# 脚本入口点
if ($MyInvocation.InvocationName -ne '.') {
    Start-AutoSync
}