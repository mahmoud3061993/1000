@echo off
cd /d "%~dp0"
echo Opening Masaref at http://127.0.0.1:8765
start http://127.0.0.1:8765
python -m http.server 8765
if errorlevel 1 python3 -m http.server 8765
pause
