#!/bin/bash
set -e

# Stop and remove container completely
docker stop openclaw 2>/dev/null || true
docker rm openclaw 2>/dev/null || true

# Clean the config file completely
cat > /opt/openclaw/data/openclaw.json << 'EOFCONFIG'
{
  "meta": {
    "lastTouchedVersion": "2026.2.25"
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
    "trustedProxies": ["127.0.0.1", "::1"]
  }
}
EOFCONFIG
chown 1000:1000 /opt/openclaw/data/openclaw.json

# Start fresh
cd /opt/openclaw
docker compose up -d
sleep 8

echo "Config:"
cat /opt/openclaw/data/openclaw.json

echo ""
echo "---"
echo "Checking for dashscope provider:"
docker exec openclaw npx openclaw models list --all 2>&1 | grep -iE 'dashscope|alibaba' | head -10 || echo "None found"

echo ""
echo "---"
echo "Gateway logs:"
docker logs --tail 15 openclaw 2>&1
