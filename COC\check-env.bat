@echo off
echo ===== 环境检查 =====
echo.

echo [1] 检查 Node.js:
node --version 2>nul || echo   X Node.js 未安装或不在 PATH 中

echo.
echo [2] 检查 npx:
npx --version 2>nul || echo   X npx 未找到

echo.
echo [3] 检查 Python:
python --version 2>nul || python3 --version 2>nul || echo   X Python 未安装

echo.
echo [4] 检查当前目录:
cd

echo.
echo [5] 检查 dist 文件夹:
if exist dist (
    echo   V dist 文件夹存在
    dir dist /b
) else (
    echo   X dist 文件夹不存在
)

echo.
echo ===== 检查完成 =====
echo.
echo 按任意键关闭...
pause > nul
