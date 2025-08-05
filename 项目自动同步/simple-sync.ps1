# 简化版CVTE项目自动同步脚本
param(
    [switch]$RunOnce = $false
)

$ProjectPath = "D:\my-project\CVTE"

function Test-GitSync {
    Write-Host "=== CVTE项目同步测试 ===" -ForegroundColor Cyan
    Write-Host "项目路径：$ProjectPath" -ForegroundColor White
    Write-Host "测试时间：$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host ""
    
    # 切换到项目目录
    Set-Location $ProjectPath
    
    # 检查Git状态
    Write-Host "[1] 检查Git状态..." -ForegroundColor Yellow
    $status = git status --porcelain
    if ($status) {
        Write-Host "检测到文件变化：" -ForegroundColor Green
        $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    } else {
        Write-Host "没有文件变化" -ForegroundColor Gray
    }
    
    # 检查远程连接
    Write-Host "\n[2] 检查远程仓库连接..." -ForegroundColor Yellow
    $remote = git remote -v
    Write-Host "远程仓库：" -ForegroundColor Green
    $remote | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # 检查分支状态
    Write-Host "\n[3] 检查分支状态..." -ForegroundColor Yellow
    $branch = git branch -a
    Write-Host "分支信息：" -ForegroundColor Green
    $branch | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # 如果有变化，尝试同步
    if ($status) {
        Write-Host "\n[4] 执行同步操作..." -ForegroundColor Yellow
        
        Write-Host "  添加文件..." -ForegroundColor Gray
        git add .
        
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "test: 测试自动同步 - $timestamp"
        
        Write-Host "  提交变化..." -ForegroundColor Gray
        git commit -m $commitMessage
        
        Write-Host "  推送到远程..." -ForegroundColor Gray
        git push origin master
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "同步成功！" -ForegroundColor Green
        } else {
            Write-Host "同步失败！" -ForegroundColor Red
        }
    }
    
    Write-Host "\n=== 测试完成 ===" -ForegroundColor Cyan
}

# 运行测试
Test-GitSync