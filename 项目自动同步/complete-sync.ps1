# Complete CVTE Project Auto Sync Script
param(
    [switch]$RunOnce = $false,
    [switch]$Monitor = $false,
    [string]$Mode = "",
    [int]$Interval = 30
)

$ProjectPath = "D:\my-project\CVTE"
$LogFile = "$PSScriptRoot\sync.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogFile -Value $logEntry -Encoding UTF8
}

function Test-GitRepository {
    if (-not (Test-Path "$ProjectPath\.git")) {
        Write-Log "Git repository not found at $ProjectPath" "ERROR"
        return $false
    }
    return $true
}

function Invoke-GitSync {
    try {
        Set-Location $ProjectPath
        
        # Check for changes
        $status = git status --porcelain
        if (-not $status) {
            Write-Log "No changes detected"
            return $true
        }
        
        Write-Log "Changes detected, starting sync..."
        
        # Add all changes
        Write-Log "Adding files..."
        git add .
        
        # Create commit message
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "auto: sync changes - $timestamp"
        
        # Commit changes
        Write-Log "Committing changes..."
        git commit -m $commitMessage
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Commit failed" "ERROR"
            return $false
        }
        
        # Push to remote
        Write-Log "Pushing to remote..."
        git push origin master
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Sync completed successfully" "SUCCESS"
            return $true
        } else {
            Write-Log "Push failed, trying pull first..." "WARN"
            git pull origin master
            git push origin master
            
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Sync completed after pull" "SUCCESS"
                return $true
            } else {
                Write-Log "Sync failed" "ERROR"
                return $false
            }
        }
    }
    catch {
        Write-Log "Error during sync: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Start-MonitorMode {
    Write-Log "Starting monitor mode (interval: $Interval seconds)"
    Write-Log "Press Ctrl+C to stop monitoring"
    
    while ($true) {
        try {
            Invoke-GitSync
            Start-Sleep -Seconds $Interval
        }
        catch {
            Write-Log "Monitor interrupted: $($_.Exception.Message)" "ERROR"
            break
        }
    }
}

function Show-Menu {
    Write-Host ""
    Write-Host "=== CVTE Project Auto Sync ===" -ForegroundColor Cyan
    Write-Host "1. Run once (single sync)" -ForegroundColor White
    Write-Host "2. Monitor mode (continuous sync)" -ForegroundColor White
    Write-Host "3. Test Git status" -ForegroundColor White
    Write-Host "4. View sync log" -ForegroundColor White
    Write-Host "5. Exit" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "Please select an option (1-5)"
    return $choice
}

function Show-GitStatus {
    Set-Location $ProjectPath
    Write-Host ""
    Write-Host "=== Git Status ===" -ForegroundColor Yellow
    git status
    Write-Host ""
    Write-Host "=== Remote Info ===" -ForegroundColor Yellow
    git remote -v
    Write-Host ""
    Write-Host "=== Branch Info ===" -ForegroundColor Yellow
    git branch -a
    Write-Host ""
}

function Show-SyncLog {
    if (Test-Path $LogFile) {
        Write-Host ""
        Write-Host "=== Last 20 Log Entries ===" -ForegroundColor Yellow
        Get-Content $LogFile -Tail 20
        Write-Host ""
    } else {
        Write-Host "No log file found" -ForegroundColor Gray
    }
}

# Main execution
Write-Log "CVTE Auto Sync Script Started"

if (-not (Test-GitRepository)) {
    Write-Log "Exiting due to Git repository check failure" "ERROR"
    exit 1
}

if ($RunOnce) {
    Write-Log "Running in single sync mode"
    $result = Invoke-GitSync
    exit $(if ($result) { 0 } else { 1 })
}

# Handle Mode parameter
if ($Mode -eq "once" -or $RunOnce) {
    Write-Log "Running single sync mode"
    Invoke-GitSync
    exit 0
}

if ($Mode -eq "continuous" -or $Monitor) {
    Start-MonitorMode
    exit 0
}

if ($Mode -eq "interactive") {
    Write-Log "Starting interactive mode"
    # Continue to interactive mode below
}

# Interactive mode (default if no mode specified)
while ($true) {
    $choice = Show-Menu
    
    switch ($choice) {
        "1" {
            Write-Log "User selected: Single sync"
            Invoke-GitSync
        }
        "2" {
            Write-Log "User selected: Monitor mode"
            Start-MonitorMode
        }
        "3" {
            Show-GitStatus
        }
        "4" {
            Show-SyncLog
        }
        "5" {
            Write-Log "User selected: Exit"
            Write-Host "Goodbye!" -ForegroundColor Green
            break
        }
        default {
            Write-Host "Invalid option, please try again" -ForegroundColor Red
        }
    }
}

Write-Log "CVTE Auto Sync Script Ended"