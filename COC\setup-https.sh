#!/bin/bash
set -e

echo "=== Generating self-signed SSL certificate ==="
mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/openclaw.key \
  -out /etc/nginx/ssl/openclaw.crt \
  -subj "/CN=43.106.117.4" \
  -addext "subjectAltName=IP:43.106.117.4" 2>&1

echo "=== Updating Nginx config for HTTPS ==="
cat > /etc/nginx/sites-available/openclaw << 'NGINXEOF'
server {
    listen 18789 ssl;
    listen [::]:18789 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/openclaw.crt;
    ssl_certificate_key /etc/nginx/ssl/openclaw.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:18790;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
NGINXEOF

nginx -t && systemctl restart nginx
echo "Nginx HTTPS OK"

echo "=== Updating OpenClaw config with trustedProxies ==="
docker exec openclaw node -e '
const fs = require("fs");
const p = "/home/node/.openclaw/openclaw.json";
const c = JSON.parse(fs.readFileSync(p,"utf8"));
c.gateway.controlUi = {
  allowedOrigins: ["https://43.106.117.4:18789"],
  dangerouslyAllowHostHeaderOriginFallback: true
};
c.gateway.trustedProxies = ["127.0.0.1", "::1"];
fs.writeFileSync(p, JSON.stringify(c, null, 2));
console.log("Config updated:");
console.log(JSON.stringify(c, null, 2));
'

echo "=== Restarting OpenClaw ==="
cd /opt/openclaw
docker compose restart
sleep 12

echo "=== Status ==="
docker compose ps
docker compose logs --tail=10

echo ""
echo "=== Test HTTPS ==="
curl -sk -o /dev/null -w "HTTPS: %{http_code}\n" --max-time 5 https://127.0.0.1:18789/
echo "=== Done ==="
