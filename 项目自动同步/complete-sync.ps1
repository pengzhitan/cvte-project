# Git Project Auto Sync Tool
# Supports single sync, monitor mode and interactive menu

param(
    [switch]$RunOnce,
    [switch]$Monitor,
    [string]$Mode = "interactive",
    [int]$Interval = 30,
    [string]$ConfigPath = "./config.json"
)

# Global variables
$script:ConfigPath = $ConfigPath
$script:LogFile = "./sync.log"
$script:Config = $null

# Load configuration function
function Load-Config {
    try {
        if (-not (Test-Path $script:ConfigPath)) {
            Write-Log "Config file not found: $script:ConfigPath" "ERROR"
            return $false
        }
        
        $configContent = Get-Content $script:ConfigPath -Raw -Encoding UTF8
        $script:Config = $configContent | ConvertFrom-Json
        
        Write-Log "Config loaded successfully" "INFO"
        return $true
    } catch {
        Write-Log "Config loading failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [switch]$NoConsole
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to log file
    try {
        Add-Content -Path $script:LogFile -Value $logEntry -Encoding UTF8
    } catch {
        if (-not $NoConsole) {
            Write-Host "Log write failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Console output
    if (-not $NoConsole) {
        switch ($Level) {
            "ERROR" { Write-Host $logEntry -ForegroundColor Red }
            "WARN" { Write-Host $logEntry -ForegroundColor Yellow }
            "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
            "DEBUG" { Write-Host $logEntry -ForegroundColor Gray }
            default { Write-Host $logEntry }
        }
    }
}

# Test Git repository function
function Test-GitRepository {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        Write-Log "Project path not found: $Path" "ERROR"
        return $false
    }
    
    if (-not (Test-Path "$Path\.git")) {
        Write-Log "Not a Git repository: $Path" "ERROR"
        return $false
    }
    
    return $true
}

# Get current branch function
function Get-CurrentBranch {
    param([string]$Path)
    
    try {
        Set-Location $Path
        $branch = git rev-parse --abbrev-ref HEAD
        return $branch
    } catch {
        Write-Log "Failed to get current branch: $($_.Exception.Message)" "ERROR"
        return "main"
    }
}

# Git sync function
function Invoke-GitSync {
    param($Config)
    
    try {
        Set-Location $Config.projectPath
        Write-Log "Changed to project directory: $($Config.projectPath)" "INFO"
        
        # Check file changes
        $status = git status --porcelain
        if (-not $status) {
            Write-Log "No file changes detected" "INFO"
            return $true
        }
        
        $changedFiles = ($status | Measure-Object).Count
        Write-Log "Detected $changedFiles file changes" "INFO"
        
        # Add files to staging area
        Write-Log "Adding files to staging area..." "INFO"
        git add .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "File add failed" "ERROR"
            return $false
        }
        
        # Generate commit message
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "$($Config.autoCommitMessage.prefix) - $timestamp ($changedFiles files)"
        
        # Commit changes
        Write-Log "Committing changes: $commitMessage" "INFO"
        git commit -m $commitMessage
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Commit failed" "ERROR"
            return $false
        }
        
        # Get current branch
        $currentBranch = Get-CurrentBranch -Path $Config.projectPath
        
        # Push to remote repository
        Write-Log "Pushing to remote branch: $currentBranch" "INFO"
        git push origin $currentBranch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Sync completed successfully!" "SUCCESS"
            return $true
        } else {
            # Push failed, try pull first
            Write-Log "Push failed, trying to pull first..." "WARN"
            git pull origin $currentBranch --rebase
            
            if ($LASTEXITCODE -eq 0) {
                git push origin $currentBranch
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Sync completed after rebase" "SUCCESS"
                    return $true
                }
            }
            
            Write-Log "Sync failed, please resolve conflicts manually" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Error during sync: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Monitor mode function
function Start-MonitorMode {
    param($Config)
    
    Write-Log "Starting monitor mode, check interval: $($Config.checkInterval) seconds" "INFO"
    Write-Log "Press Ctrl+C to stop monitoring" "INFO"
    
    $lastSyncTime = Get-Date
    
    try {
        while ($true) {
            $syncResult = Invoke-GitSync -Config $Config
            
            if ($syncResult) {
                $lastSyncTime = Get-Date
                Write-Log "Monitor sync completed, next check time: $($lastSyncTime.AddSeconds($Config.checkInterval).ToString('HH:mm:ss'))" "INFO"
            }
            
            Start-Sleep -Seconds $Config.checkInterval
        }
    } catch [System.Management.Automation.PipelineStoppedException] {
        Write-Log "Monitor mode stopped" "INFO"
    } catch {
        Write-Log "Monitor mode error: $($_.Exception.Message)" "ERROR"
    }
}

# Show menu function
function Show-Menu {
    Clear-Host
    Write-Host "=== Git Project Auto Sync Tool ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Execute single sync" -ForegroundColor Green
    Write-Host "2. Start monitor mode" -ForegroundColor Yellow
    Write-Host "3. View Git status" -ForegroundColor Blue
    Write-Host "4. View sync logs" -ForegroundColor Magenta
    Write-Host "5. Exit program" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please select operation (1-5): " -NoNewline -ForegroundColor White
}

# Show Git status function
function Show-GitStatus {
    param($Config)
    
    try {
        Set-Location $Config.projectPath
        Write-Host "`n=== Git Status Information ===" -ForegroundColor Cyan
        
        # Current branch
        $currentBranch = Get-CurrentBranch -Path $Config.projectPath
        Write-Host "Current branch: $currentBranch" -ForegroundColor Green
        
        # File status
        Write-Host "`nFile status:" -ForegroundColor Yellow
        $status = git status --porcelain
        if ($status) {
            $status | ForEach-Object { Write-Host "  $_" }
        } else {
            Write-Host "  Working directory clean" -ForegroundColor Green
        }
        
        # Recent commits
        Write-Host "`nRecent commits:" -ForegroundColor Yellow
        git log --oneline -5
        
        Write-Host "`nPress any key to return to menu..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } catch {
        Write-Host "Failed to get Git status: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Press any key to return to menu..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}

# Show sync logs function
function Show-SyncLog {
    try {
        if (Test-Path $script:LogFile) {
            Write-Host "`n=== Sync Logs (Last 20 entries) ===" -ForegroundColor Cyan
            Get-Content $script:LogFile -Tail 20 | ForEach-Object {
                if ($_ -match "ERROR") {
                    Write-Host $_ -ForegroundColor Red
                } elseif ($_ -match "WARN") {
                    Write-Host $_ -ForegroundColor Yellow
                } elseif ($_ -match "SUCCESS") {
                    Write-Host $_ -ForegroundColor Green
                } else {
                    Write-Host $_
                }
            }
        } else {
            Write-Host "`nLog file does not exist" -ForegroundColor Yellow
        }
        
        Write-Host "`nPress any key to return to menu..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } catch {
        Write-Host "Failed to read logs: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Press any key to return to menu..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
}

# Main execution logic
if ($RunOnce) {
    Write-Log "Starting single sync mode" "INFO"
    if (Load-Config) {
        $result = Invoke-GitSync -Config $script:Config
        if ($result) {
            Write-Log "Single sync completed" "SUCCESS"
        } else {
            Write-Log "Single sync failed" "ERROR"
            exit 1
        }
    } else {
        Write-Log "Config loading failed" "ERROR"
        exit 1
    }
} elseif ($Monitor) {
    Write-Log "Starting monitor mode" "INFO"
    if (Load-Config) {
        Start-MonitorMode -Config $script:Config
    } else {
        Write-Log "Config loading failed" "ERROR"
        exit 1
    }
} else {
    # Interactive menu mode
    Write-Log "Starting interactive mode" "INFO"
    
    if (-not (Load-Config)) {
        Write-Host "Config loading failed, program exit" -ForegroundColor Red
        exit 1
    }
    
    # Check project path
    if (-not (Test-Path $script:Config.projectPath)) {
        Write-Log "Project path does not exist: $($script:Config.projectPath)" "ERROR"
        exit 1
    }
    
    # Check Git repository
    if (-not (Test-Path "$($script:Config.projectPath)\.git")) {
        Write-Log "Git repository does not exist: $($script:Config.projectPath)" "ERROR"
        exit 1
    }
    
    do {
        Show-Menu
        $choice = Read-Host
        
        switch ($choice) {
            "1" {
                Write-Host "`nExecuting single sync..." -ForegroundColor Green
                $result = Invoke-GitSync -Config $script:Config
                if ($result) {
                    Write-Host "Sync completed!" -ForegroundColor Green
                } else {
                    Write-Host "Sync failed!" -ForegroundColor Red
                }
                Write-Host "Press any key to continue..." -ForegroundColor Gray
                $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            }
            "2" {
                Write-Host "`nStarting monitor mode..." -ForegroundColor Yellow
                Start-MonitorMode -Config $script:Config
            }
            "3" {
                Show-GitStatus -Config $script:Config
            }
            "4" {
                Show-SyncLog
            }
            "5" {
                Write-Host "`nProgram exit" -ForegroundColor Green
                break
            }
            default {
                Write-Host "`nInvalid selection, please enter 1-5" -ForegroundColor Red
                Start-Sleep -Seconds 1
            }
        }
    } while ($choice -ne "5")
}