$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$projectName = "Chuan-TCPL"
$zipFileName = "..\${projectName}_backup_${timestamp}.zip"

Write-Host "Backing up project to $zipFileName using tar..."

# Use native tar (bsdtar) on Windows for fast backup
# -a: Auto-compress based on extension
# -c: Create
# -f: Filename
# Note: tar on Windows might output warnings for some locked files, but generally works well for source code.
# We exclude node_modules and other build artifacts to keep it small.

tar -a -c -f $zipFileName `
    --exclude "node_modules" `
    --exclude ".next" `
    --exclude ".git" `
    --exclude ".venv" `
    --exclude ".vscode" `
    --exclude "out" `
    --exclude "build" `
    --exclude ".env" `
    --exclude "firebase-adminsdk*" `
    --exclude "service-account*" `
    .

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup completed successfully: $zipFileName"
}
else {
    Write-Host "Backup process finished with exit code $LASTEXITCODE"
}
