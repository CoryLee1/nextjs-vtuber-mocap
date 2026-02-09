@echo off
REM Script to push public repository to GitHub for Gemini 3 Hackathon
REM Author: CoryLee1
REM Email: cory@anngel.live

cd /d "%~dp0"

echo ==========================================
echo 📦 Pushing to GitHub: CoryLee1/echuu-gemini3-hackathon
echo ==========================================
echo.

REM Verify we're in the right directory
cd
echo.

REM Show current status
echo 📊 Git Status:
git status
echo.

REM Show recent commits
echo 📝 Recent Commits:
git log --oneline -5
echo.

REM Show remote
echo 🔗 Remote Repository:
git remote -v
echo.

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push -u origin main

echo.
echo ✅ Done! Repository at: https://github.com/CoryLee1/echuu-gemini3-hackathon
pause
