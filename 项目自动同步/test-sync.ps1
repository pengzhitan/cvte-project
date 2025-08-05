# Simple Git Sync Test Script
param(
    [switch]$RunOnce = $false
)

$ProjectPath = "D:\my-project\CVTE"

function Test-GitSync {
    Write-Host "=== Git Sync Test ===" -ForegroundColor Cyan
    Write-Host "Project Path: $ProjectPath" -ForegroundColor White
    Write-Host "Test Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
    Write-Host ""
    
    # Change to project directory
    Set-Location $ProjectPath
    
    # Check Git status
    Write-Host "[1] Checking Git status..." -ForegroundColor Yellow
    $status = git status --porcelain
    if ($status) {
        Write-Host "File changes detected:" -ForegroundColor Green
        $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    } else {
        Write-Host "No file changes" -ForegroundColor Gray
    }
    
    # Check remote connection
    Write-Host "`n[2] Checking remote repository..." -ForegroundColor Yellow
    $remote = git remote -v
    Write-Host "Remote repository:" -ForegroundColor Green
    $remote | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # Check branch status
    Write-Host "`n[3] Checking branch status..." -ForegroundColor Yellow
    $branch = git branch -a
    Write-Host "Branch info:" -ForegroundColor Green
    $branch | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # If there are changes, try to sync
    if ($status) {
        Write-Host "`n[4] Performing sync operation..." -ForegroundColor Yellow
        
        Write-Host "  Adding files..." -ForegroundColor Gray
        git add .
        
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "test: auto sync test - $timestamp"
        
        Write-Host "  Committing changes..." -ForegroundColor Gray
        git commit -m $commitMessage
        
        Write-Host "  Pushing to remote..." -ForegroundColor Gray
        git push origin master
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Sync successful!" -ForegroundColor Green
        } else {
            Write-Host "Sync failed!" -ForegroundColor Red
        }
    }
    
    Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
}

# Run the test
Test-GitSync