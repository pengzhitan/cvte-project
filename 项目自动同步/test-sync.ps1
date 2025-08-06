# CVTE Project Auto Sync Tool - Test Version
param(
    [string]$Mode = "once"
)

# Configuration file path
$ConfigPath = "$PSScriptRoot\config.json"
$LogFile = "$PSScriptRoot\sync.log"

# Log function
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
        Write-Host "Log write failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Load configuration
function Load-Config {
    try {
        if (Test-Path $ConfigPath) {
            $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
            Write-Log "Config loaded successfully" "SUCCESS"
            return $config
        } else {
            Write-Log "Config file not found: $ConfigPath" "ERROR"
            return $null
        }
    } catch {
        Write-Log "Config parse failed: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# Git sync function
function Invoke-GitSync {
    param($Config)
    
    try {
        Set-Location $Config.projectPath
        Write-Log "Changed to project directory: $($Config.projectPath)" "INFO"
        
        # Check Git status
        $status = git status --porcelain
        if (-not $status) {
            Write-Log "No file changes detected" "INFO"
            return $true
        }
        
        $changedFiles = ($status | Measure-Object).Count
        Write-Log "Detected $changedFiles file changes" "INFO"
        
        # Add files
        Write-Log "Adding files to staging area..." "INFO"
        git add .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "File add failed" "ERROR"
            return $false
        }
        
        # Commit
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $commitMessage = "$($Config.autoCommitMessage.prefix) - $timestamp ($changedFiles files)"
        
        Write-Log "Committing changes: $commitMessage" "INFO"
        git commit -m $commitMessage
        
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Commit failed" "ERROR"
            return $false
        }
        
        # Push
        $currentBranch = git rev-parse --abbrev-ref HEAD
        Write-Log "Pushing to remote branch: $currentBranch" "INFO"
        git push origin $currentBranch
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Sync completed successfully!" "SUCCESS"
            return $true
        } else {
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

# Main program
Write-Host "`n=== CVTE Project Auto Sync Tool ===" -ForegroundColor Cyan

# Load configuration
$Config = Load-Config
if (-not $Config) {
    Write-Host "Config loading failed, exiting" -ForegroundColor Red
    exit 1
}

# Check project path
if (-not (Test-Path $Config.projectPath)) {
    Write-Log "Project path does not exist: $($Config.projectPath)" "ERROR"
    exit 1
}

# Check Git repository
if (-not (Test-Path "$($Config.projectPath)\.git")) {
    Write-Log "Git repository does not exist: $($Config.projectPath)" "ERROR"
    exit 1
}

# Execute sync
if ($Mode -eq "once") {
    Write-Log "Executing single sync" "INFO"
    $result = Invoke-GitSync -Config $Config
    
    if ($result) {
        Write-Host "`n✅ Sync completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "`n❌ Sync failed, please check logs" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n📖 Usage:" -ForegroundColor White
    Write-Host "  .\test-sync.ps1 -Mode once  # Single sync" -ForegroundColor Gray
}

Write-Host "`nProgram execution completed" -ForegroundColor Green