@echo off
echo === COC Hub Deployment ===
echo.

:: 检查是否安装了ssh2
if not exist "node_modules\ssh2\package.json" (
    echo [1/3] Installing ssh2 module...
    call npm install ssh2 --save-dev
    if errorlevel 1 (
        echo Failed to install ssh2
        pause
        exit /b 1
    )
) else (
    echo [1/3] ssh2 module already installed
)

echo.
echo [2/3] Building project...
call npm run build
if errorlevel 1 (
    echo Build failed, but continuing with existing dist...
)

echo.
echo [3/3] Deploying to server...
node deploy-to-server.cjs

echo.
echo Press any key to exit...
pause > nul
