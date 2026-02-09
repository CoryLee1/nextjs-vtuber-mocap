#!/bin/bash
# Script to push public repository to GitHub for Gemini 3 Hackathon
# Author: CoryLee1
# Email: cory@anngel.live

cd "$(dirname "$0")"

echo "=========================================="
echo "📦 Pushing to GitHub: CoryLee1/echuu-gemini3-hackathon"
echo "=========================================="
echo ""

# Verify we're in the right directory
pwd
echo ""

# Show current status
echo "📊 Git Status:"
git status
echo ""

# Show recent commits
echo "📝 Recent Commits:"
git log --oneline -5
echo ""

# Show remote
echo "🔗 Remote Repository:"
git remote -v
echo ""

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Done! Repository at: https://github.com/CoryLee1/echuu-gemini3-hackathon"
