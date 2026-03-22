#!/bin/bash
set -e

# Update Nginx config to explicitly forward Origin header
cat > /etc/nginx/sites-available/openclaw << 'EOFNGINX'
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
        proxy_set_header Origin $http_origin;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOFNGINX

nginx -t && systemctl reload nginx
echo "Nginx reloaded"

# Check services
echo "---"
echo "Nginx status:"
ss -tlnp | grep 18789

echo "---"
echo "Gateway logs (last 10):"
docker logs --tail 10 openclaw 2>&1
