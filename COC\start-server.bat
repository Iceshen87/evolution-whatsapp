@echo off
cd /d "%~dp0"
echo 正在启动 COC Hub 预览服务器...
echo.
echo 请稍候，服务器启动后会自动打开浏览器...
echo.

:: 尝试使用 Vite preview
npx vite preview --port 5173 --host

:: 如果 Vite 失败，使用 Python
if errorlevel 1 (
    echo.
    echo 尝试使用 Python 服务器...
    python -m http.server 5173 --directory dist
)

:: 如果 Python 失败，使用 Node.js
if errorlevel 1 (
    echo.
    echo 尝试使用 Node.js 服务器...
    npx serve dist -p 5173 -s
)

echo.
echo 服务器已启动，请访问 http://localhost:5173
echo 按任意键关闭服务器...
pause > nul
