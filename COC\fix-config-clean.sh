#!/bin/bash
set -e

# Stop container first
docker stop openclaw 2>/dev/null || true

# Fix the config file directly
cat > /opt/openclaw/data/openclaw.json << 'EOFCONFIG'
{
  "meta": {
    "lastTouchedVersion": "2026.2.25",
    "lastTouchedAt": "2026-02-26T09:20:15.635Z"
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "openai/gpt-4o"
      }
    }
  },
  "commands": {
    "native": "auto",
    "nativeSkills": "auto",
    "restart": true,
    "ownerDisplay": "raw"
  },
  "gateway": {
    "mode": "local",
    "controlUi": {
      "allowedOrigins": [
        "https://43.106.117.4:18789",
        "http://43.106.117.4:18789",
        "https://43.106.117.4",
        "http://43.106.117.4"
      ],
      "dangerouslyAllowHostHeaderOriginFallback": true,
      "allowInsecureAuth": true
    },
    "auth": {
      "mode": "token",
      "token": "c9c95f1ac23952152c018c5a2e6259f56830dba66292477b"
    },
    "trustedProxies": [
      "127.0.0.1",
      "::1"
    ]
  }
}
EOFCONFIG

chown 1000:1000 /opt/openclaw/data/openclaw.json
echo "Config fixed"

# Update docker-compose to use the model name that DashScope expects
cat > /opt/openclaw/docker-compose.yml << 'EOFDOCKER'
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    container_name: openclaw
    restart: unless-stopped
    network_mode: host
    user: "1000:1000"
    environment:
      - OPENCLAW_GATEWAY_PORT=18790
      - OPENAI_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
      - OPENAI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
      # Override the model name sent to API
      - OPENCLAW_MODEL=qwen-coder-plus-latest
    volumes:
      - /opt/openclaw/data:/home/node/.openclaw
EOFDOCKER

cd /opt/openclaw
docker compose up -d
sleep 8

echo "---"
echo "Container status:"
docker ps --filter name=openclaw

echo "---"
echo "Logs:"
docker logs --tail 15 openclaw 2>&1
