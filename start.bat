@echo off
echo Starting RipSave Backend and Frontend...

:: Start Backend in a new window
start "RipSave Backend" cmd /k "cd backend && python server.py"

:: Start Frontend in a new window
start "RipSave Frontend" cmd /k "cd frontend && npm start"

echo Both servers are starting in separate windows.
