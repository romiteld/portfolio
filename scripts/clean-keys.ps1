# PowerShell script to clean sensitive data from git history using git filter-repo
# Requires git-filter-repo to be installed: https://github.com/newren/git-filter-repo

# Check if git-filter-repo is available
$gitFilterRepoAvailable = $null
try {
    $gitFilterRepoAvailable = Get-Command git-filter-repo -ErrorAction SilentlyContinue
} catch {
    # Command not found
}

if (-not $gitFilterRepoAvailable) {
    Write-Host "ERROR: git-filter-repo not found." -ForegroundColor Red
    Write-Host "Please install it following instructions at: https://github.com/newren/git-filter-repo#installation"
    exit 1
}

# Create backup before proceeding
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "..\..\portfolio_backup_$timestamp"
Write-Host "Creating backup in $backupDir..." -ForegroundColor Yellow
Copy-Item -Path "." -Destination $backupDir -Recurse -Force
Write-Host "Backup created." -ForegroundColor Green

# Create temporary file with sensitive patterns to replace
$replacementsFile = ".\replacements.txt"
@"
# OpenAI API Keys - these are dummy patterns for demonstration
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==>OPENAI_API_KEY_PLACEHOLDER
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6aHJtZmZ3cmtndmF6aWlvbXB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDE0NDA5MiwiZXhwIjoyMDU1NzIwMDkyfQ.1ElF1E9DBa7oYDoifg0n8KWd7jShx3jXJyaVTgCytTk==>SUPABASE_KEY_PLACEHOLDER
"@ | Out-File -FilePath $replacementsFile -Encoding UTF8

Write-Host "Cleaning repository history..." -ForegroundColor Yellow
Write-Host "This may take some time depending on the size of your repository." -ForegroundColor Yellow

# Run git filter-repo to replace sensitive data
git filter-repo --replace-text $replacementsFile

# Clean up temporary files
Remove-Item -Path $replacementsFile -Force

Write-Host "Repository history cleaning complete." -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Review the changes to ensure sensitive data was properly removed"
Write-Host "2. Force push to your repository: git push --force"
Write-Host "3. Ask all team members to re-clone the repository"
Write-Host ""
Write-Host "Note: If GitHub still blocks your push due to secret detection, you may need to use their UI to approve these changes." 