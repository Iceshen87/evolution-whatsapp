$server = "8.222.170.254"
$user = "root"
$password = "Teck0358"

# Create credential object
$securePassword = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($user, $securePassword)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Auto Deploying to: $server" -ForegroundColor Cyan
Write-Host "========================================`n"

$commands = @"
cd /root/evolution-whatsapp
echo '[1/6] Stopping containers...'
docker compose down
echo '[2/6] Removing frontend image...'
docker rmi evolution-whatsapp-frontend 2>/dev/null || true
echo '[3/6] Building frontend and backend (no cache)...'
docker compose build --no-cache frontend backend
echo '[4/6] Starting services...'
docker compose up -d
echo '[5/6] Checking status...'
docker compose ps
echo '[6/6] Done!'
"@

# Execute via SSH using plink-like method with expect-style input
$process = Start-Process -FilePath "C:\Windows\System32\OpenSSH\ssh.exe" `
    -ArgumentList "-o","StrictHostKeyChecking=no","-o","UserKnownHostsFile=/dev/null","$user@$server",$commands `
    -RedirectStandardOutput "$PSScriptRoot\ssh-output.txt" `
    -RedirectStandardError "$PSScriptRoot\ssh-error.txt" `
    -PassThru -Wait -NoNewWindow

Write-Host "SSH process exited with code: $($process.ExitCode)"
Write-Host "`nOutput:" -ForegroundColor Yellow
Get-Content "$PSScriptRoot\ssh-output.txt" -Raw
if (Test-Path "$PSScriptRoot\ssh-error.txt") {
    Write-Host "`nErrors:" -ForegroundColor Red
    Get-Content "$PSScriptRoot\ssh-error.txt" -Raw
}
