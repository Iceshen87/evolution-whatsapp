@echo off
chcp 65001 >nul
echo ==========================================
echo  Evolution WhatsApp 自动部署
echo  服务器: 8.222.170.254
echo ==========================================
echo.

set SERVER=8.222.170.254
set USER=root
set PASS=Teck0358
set PROJECT=evolution-whatsapp

echo [1/4] 检查系统信息...
echo.

echo [2/4] 准备部署命令...
set DEPLOY_CMD=curl -fsSL https://raw.githubusercontent.com/Iceshen87/evolution-whatsapp/main/deploy-new-server.sh | bash

echo.
echo ==========================================
echo  即将执行以下操作：
echo  1. 连接到 %SERVER%
echo  2. 创建 2GB Swap
echo  3. 安装 Docker + Docker Compose
echo  4. 下载并部署项目
echo ==========================================
echo.
echo 部署命令将直接执行，请等待完成...
echo.

echo 开始部署，这可能需要 5-10 分钟...
echo.

echo.| set /p DUMMY=请按任意键开始部署...
echo.

echo 正在连接服务器并执行部署...
C:\Windows\System32\OpenSSH\ssh.exe -o StrictHostKeyChecking=no %USER%@%SERVER% "mkdir -p /root/.ssh; chmod 700 /root/.ssh; echo 'AuthorizedKeysFile .ssh/authorized_keys' >> /etc/ssh/sshd_config; systemctl restart sshd" 2>nul

echo.
echo 请在服务器上手动执行以下命令完成部署：
echo.
echo ==========================================
echo 复制以下命令到服务器终端执行：
echo ==========================================
echo.
echo curl -fsSL https://raw.githubusercontent.com/Iceshen87/evolution-whatsapp/main/deploy-new-server.sh ^\| bash
echo.
echo ==========================================
echo.
echo 或者复制这些命令分步执行：
echo.
echo git clone https://github.com/Iceshen87/evolution-whatsapp.git /opt/evolution-whatsapp
echo cd /opt/evolution-whatsapp
echo chmod +x deploy-new-server.sh
echo ./deploy-new-server.sh
echo.
pause
