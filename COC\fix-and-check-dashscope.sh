#!/bin/bash
set -e

# Stop container and fix config
docker stop openclaw 2>/dev/null || true

# Write clean config
cat > /opt/openclaw/data/openclaw.json << 'EOFCONFIG'
{
  "meta": {
    "lastTouchedVersion": "2026.2.25",
    "lastTouchedAt": "2026-02-26T09:40:00.507Z"
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

docker start openclaw
sleep 5

# Check for dashscope provider
echo "Checking for dashscope provider..."
docker exec openclaw npx openclaw models list --all 2>&1 | grep -i dashscope | head -10 || echo "No dashscope models found"

echo "---"
docker logs --tail 10 openclaw 2>&1
