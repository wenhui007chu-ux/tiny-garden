@echo off
chcp 65001 >nul
title 手提小菜园 · 服务器守护
cd /d "%~dp0"

echo ============================================
echo   手提小菜园 - 服务器守护
echo ============================================
echo   它会盯着 5173 端口，服务器一停就自动拉起来。
echo   游戏地址： http://localhost:5173
echo   关掉这个窗口就停止守护。
echo ============================================
echo.

:loop
rem 检查 5173 是否在监听
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [%time:~0,8%] 服务器没在跑，正在启动...
    start "farming-game-server" /min cmd /c "npm run dev -- --port 5173 --strictPort"
    rem 给它几秒起身
    timeout /t 6 /nobreak >nul
) else (
    rem 活着就每 5 秒看一眼
    timeout /t 5 /nobreak >nul
)
goto loop
