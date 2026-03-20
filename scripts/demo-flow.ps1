$ErrorActionPreference = "SilentlyContinue"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

# Clean previous data
if (Test-Path "runs") { Remove-Item -Recurse -Force "runs" }
if (Test-Path "artifacts") { Remove-Item -Recurse -Force "artifacts" }

$ErrorActionPreference = "Stop"

# Build project
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

# Start UI in background
Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"Set-Location '$repoRoot'; npm run continuum -- ui`""

# Wait for UI to boot
Start-Sleep -Seconds 5

# Run drift demo
npm run continuum -- drift-demo

Write-Host ""
Write-Host "Demo ready:"
Write-Host "1. Open http://localhost:3000"
Write-Host "2. Click 'Debug Latest Drift'"
Write-Host ""

