@echo off
cd /d "%~dp0"
echo 正在启动 COC Hub 开发服务器...
echo.

:: 检查 node_modules 是否存在
if not exist node_modules (
    echo 首次运行，正在安装依赖...
    npm install
    if errorlevel 1 (
        echo 安装失败，请检查网络连接
        pause
        exit /b 1
    )
    echo 依赖安装完成！
    echo.
)

echo 启动开发服务器...
echo 请稍候，稍后会自动打开浏览器...
echo.
npm run dev

echo.
echo 服务器已关闭
pause
