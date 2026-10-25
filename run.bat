@echo off
title Achievement Hub
echo ========================================================
echo  Starting Achievement Hub...
echo ========================================================

:: Ensure Node.js is on PATH
set "PATH=C:\Users\PRATHMESH\AppData\Local\Programs\nodejs;%PATH%"

:: Open browser automatically after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Start optimized server
npx next start -p 3000
pause
