@echo off
echo ==========================================
echo    COC Hub 服务器重启工具
echo ==========================================
echo.

:: 查找并关闭现有的 Node.js 进程
echo [1/3] 正在关闭现有服务器...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul
echo      已关闭现有进程
echo.

:: 启动后端服务器
echo [2/3] 正在启动后端服务器 (端口 3001)...
cd /d "%~dp0"
start "后端服务器 - 3001" cmd /c "npm run dev:server ^& pause"
echo      后端服务器启动中...
echo.

:: 等待后端启动
timeout /t 5 /nobreak >nul

:: 启动前端服务器
echo [3/3] 正在启动前端服务器 (端口 5173)...
start "前端服务器 - 5173" cmd /c "npm run dev ^& pause"
echo      前端服务器启动中...
echo.

:: 等待前端启动
timeout /t 5 /nobreak >nul

echo ==========================================
echo    服务器启动命令已发送！
echo ==========================================
echo.
echo 请等待 5-10 秒后访问：
echo   前端: http://localhost:5173
echo   后端: http://localhost:3001
echo.
echo 如果无法访问，请检查弹出的两个 CMD 窗口中的错误信息。
echo.
pause
