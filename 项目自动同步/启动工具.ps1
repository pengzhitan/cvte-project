# CVTE Auto Sync Tool Launcher
# Set console encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Set working directory
Set-Location $PSScriptRoot

# Show menu function
function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "           CVTE Auto Sync Tool" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please select mode:" -ForegroundColor Yellow
    Write-Host "1. Monitor mode (recommended)" -ForegroundColor Green
    Write-Host "2. Run once" -ForegroundColor White
    Write-Host "3. Interactive mode" -ForegroundColor White
    Write-Host "4. Exit" -ForegroundColor Red
    Write-Host ""
}

# Main loop
do {
    Show-Menu
    $choice = Read-Host "Please select (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Host "Starting monitor mode..." -ForegroundColor Green
            & "$PSScriptRoot\complete-sync.ps1" -Monitor
            break
        }
        "2" {
            Write-Host "Running once..." -ForegroundColor Green
            & "$PSScriptRoot\complete-sync.ps1" -RunOnce
            break
        }
        "3" {
            Write-Host "Starting interactive mode..." -ForegroundColor Green
            & "$PSScriptRoot\complete-sync.ps1"
            break
        }
        "4" {
            Write-Host "Goodbye!" -ForegroundColor Yellow
            exit
        }
        default {
            Write-Host "Invalid option, please try again" -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
} while ($choice -ne "4")

Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')