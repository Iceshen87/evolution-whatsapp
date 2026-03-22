# PowerShell SSH 自动修复脚本
$server = "8.222.170.254"
$username = "root"
$password = "Teck0358"

# 添加 SSH 到 PATH
$env:PATH += ";C:\Windows\System32\OpenSSH"

# 创建命令
$commands = @"
cd /opt/evolution-whatsapp
docker compose -f docker-compose.light.yml down -v
docker compose -f docker-compose.light.yml up -d
echo "Waiting for services..."
sleep 30
docker compose -f docker-compose.light.yml ps
echo "=== Evolution API Logs ==="
docker compose -f docker-compose.light.yml logs --tail=20 evolution-api
"@

# 使用 echo 管道输入密码
echo $password | ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=yes "$username@$server" $commands
