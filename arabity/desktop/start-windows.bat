@echo off
setlocal
cd /d "%~dp0\..\dist"
where python >nul 2>nul && (
  start "" http://127.0.0.1:8765/
  python -m http.server 8765 --bind 127.0.0.1
  goto :eof
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-windows.ps1"
