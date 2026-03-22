param(
    [string]$Password = "Teck0358"
)

$server = "root@47.236.151.160"
$remoteDir = "/root/COC"

Write-Host "=== COC Hub Deployment Script ===" -ForegroundColor Cyan
Write-Host ""

# 1. Create remote directory
Write-Host "[1/5] Creating remote directory..." -ForegroundColor Yellow
echo $Password | ssh -o StrictHostKeyChecking=no $server "mkdir -p $remoteDir/server $remoteDir/dist"

# 2. Copy dist folder
Write-Host "[2/5] Copying dist folder..." -ForegroundColor Yellow
Get-ChildItem -Path "dist" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\dist\", "")
    if (-not $_.PSIsContainer) {
        $destPath = "$remoteDir/dist/$relativePath"
        & scp -o StrictHostKeyChecking=no "$($_.FullName)" "$server`:$destPath"
    }
}

# 3. Copy server folder
Write-Host "[3/5] Copying server folder..." -ForegroundColor Yellow
Get-ChildItem -Path "server" -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + "\server\", "")
    if (-not $_.PSIsContainer) {
        $destPath = "$remoteDir/server/$relativePath"
        & scp -o StrictHostKeyChecking=no "$($_.FullName)" "$server`:$destPath"
    }
}

# 4. Copy package.json and env
Write-Host "[4/5] Copying config files..." -ForegroundColor Yellow
& scp -o StrictHostKeyChecking=no "package.json" "$server`:$remoteDir/"
& scp -o StrictHostKeyChecking=no ".env.example" "$server`:$remoteDir/"

# 5. Install and start
Write-Host "[5/5] Installing and starting server..." -ForegroundColor Yellow
echo $Password | ssh -o StrictHostKeyChecking=no $server "cd $remoteDir && npm install && npm run dev:server &"

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "API: http://47.236.151.160:3001"
Write-Host "Frontend: http://47.236.151.160"
