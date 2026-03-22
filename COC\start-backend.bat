@echo off
cd /d "%~dp0"
echo 正在启动后端服务器...
npm run dev:server
pause
