#!/bin/bash
# Script to clean git repository of sensitive data

echo "===== Git Repository Cleaning Tool ====="
echo "This script will help remove sensitive data from git history."
echo "WARNING: This will rewrite git history. All team members will need to re-clone the repository."
echo ""
echo "Make sure you have BFG Repo-Cleaner installed: https://rtyley.github.io/bfg-repo-cleaner/"
echo ""

# Ensure we have BFG
if ! command -v bfg &> /dev/null; then
    echo "ERROR: BFG Repo-Cleaner not found in path."
    echo "Please download it from: https://rtyley.github.io/bfg-repo-cleaner/"
    exit 1
fi

# First, create a backup
echo "Creating backup of repository..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="../portfolio_backup_$TIMESTAMP"
cp -r ../ $BACKUP_DIR
echo "Backup created at: $BACKUP_DIR"

echo ""
echo "Removing files containing sensitive information..."

# Replace these patterns with your specific sensitive data patterns
bfg --replace-text ../sensitive-patterns.txt

# Remove files that should never have been committed
bfg --delete-files "*.env" --delete-files "*.key" --delete-files "*secret*"

echo ""
echo "Cleaning repository..."
cd ..
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "===== Cleaning Complete ====="
echo "Next steps:"
echo "1. Force push to your repository: git push --force"
echo "2. Tell all collaborators to re-clone the repository"
echo ""
echo "If you see errors about 'protected commits', follow the instructions from GitHub to unblock secrets." 