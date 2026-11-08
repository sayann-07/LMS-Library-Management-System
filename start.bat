@echo off
title Library Management System Launcher
echo ====================================================
echo   Starting Library Management System (DBMS Project)
echo ====================================================
echo.
echo Starting Backend API (Port 5000)...
start "Library Backend (Port 5000)" cmd /k "cd backend && npm run dev"

echo Waiting 2 seconds for database pool to initialize...
ping 127.0.0.1 -n 3 >nul

echo Starting Frontend UI (Port 5173)...
start "Library Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================
echo   Both services started successfully!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ====================================================
