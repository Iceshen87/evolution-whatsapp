#!/bin/bash
set -e

# Update Nginx to support both HTTP and HTTPS on port 18789
# Since we can't use two protocols on same port, we'll use HTTP redirect

# First, update the existing config to also accept HTTP on a different port (18788) and redirect
cat > /etc/nginx/sites-available/openclaw << 'EOFNGINX'
# HTTP redirect to HTTPS
server {
    listen 18788;
    listen [::]:18788;
    server_name _;
    return 301 https://$host:18789$request_uri;
}

# Main HTTPS server
server {
    listen 18789 ssl;
    listen [::]:18789 ssl;
    server_name _;

    ssl_certificate /etc/nginx/ssl/openclaw.crt;
    ssl_certificate_key /etc/nginx/ssl/openclaw.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Handle HTTP on HTTPS port - return helpful error
    error_page 497 =301 https://$host:$server_port$request_uri;

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
echo "Nginx updated with HTTP->HTTPS redirect"

echo "---"
echo "Testing access:"
curl -sk -o /dev/null -w "HTTPS: %{http_code}\n" https://127.0.0.1:18789/
