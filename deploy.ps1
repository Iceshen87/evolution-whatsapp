$server = "8.222.170.254"
$user = "root"
$password = "Teck0358"
$commands = "cd /root/evolution-whatsapp && docker compose down && docker rmi evolution-whatsapp-frontend 2>/dev/null; docker compose build --no-cache frontend backend && docker compose up -d && docker compose ps"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Auto Deploying to: $server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$cmd = "sshpass -p '$password' ssh -o StrictHostKeyChecking=no $user@$server '$commands'"
Write-Host "Executing: $cmd"
Write-Host ""

Invoke-Expression $cmd
