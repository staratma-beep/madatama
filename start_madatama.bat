@echo off
title Madatama Launcher
echo ==============================================
echo        MEMULAI APLIKASI WEB MADATAMA
echo ==============================================
echo.

echo [1/3] Menjalankan Backend (FastAPI)...
start "Madatama Backend" cmd /k "cd backend && color 0A && echo === BACKEND SERVER === && python -m uvicorn server:app --reload --port 8000"

echo [2/3] Menjalankan Frontend Admin / POS (React)...
start "Madatama Frontend Admin" cmd /k "cd frontend && color 09 && echo === FRONTEND ADMIN === && npm start"

echo [3/3] Menjalankan Frontend Web Publik (Vite)...
start "Madatama Frontend Public" cmd /k "cd frontend-public && color 0D && echo === FRONTEND PUBLIC === && npm run dev"

echo.
echo ==============================================
echo Berhasil! 3 jendela terminal baru telah terbuka.
echo - Tab Admin: http://localhost:3000
echo - Tab Web Publik: http://localhost:5173
echo - Backend API: http://localhost:8000
echo ==============================================
echo Anda dapat menutup jendela terminal (cmd) masing-masing untuk mematikan server.
pause
