# Deploy script - Update code from GitHub and rebuild
$server = "8.222.170.254"
$user = "root"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Deploying to Server: $server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# SSH commands to execute on server
$commands = @"
cd /root/evolution-whatsapp
echo '[1/4] Pulling latest code from GitHub...'
git pull origin main

echo '[2/4] Stopping containers...'
docker-compose down

echo '[3/4] Building frontend and backend...'
docker-compose build --no-cache frontend backend

echo '[4/4] Starting services...'
docker-compose up -d

echo '========================================'
echo ' Deployment Complete!'
echo '========================================'
docker-compose ps
"@

# Execute via SSH
$sshCommand = "ssh $user@$server `"$commands`""
Invoke-Expression $sshCommand
