@echo off
setlocal
mode con: cols=92 lines=32
title MITS Campus Hub - Live Attendance Scraper
color 0B

echo ======================================================================
echo           MITS CAMPUS HUB - LIVE ETLAB ATTENDANCE SCRAPER
echo ======================================================================
echo.
echo Connecting to https://mits.etlab.app/user/login...
echo Fetching latest attendance from ETLAB portal...
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scrape_attendance.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Failed to fetch data from ETLAB. Please check your internet connection.
    echo.
) else (
    echo.
    echo [DONE] MITS Campus Hub has been updated and opened in your browser!
    echo.
)

pause
