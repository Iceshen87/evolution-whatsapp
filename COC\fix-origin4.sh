#!/bin/bash
set -e

# Edit config directly on host filesystem (volume mount)
cat > /opt/openclaw/data/openclaw.json << 'EOFCONFIG'
{
  "commands": {
    "native": "auto",
    "nativeSkills": "auto",
    "restart": true,
    "ownerDisplay": "raw"
  },
  "gateway": {
    "auth": {
      "mode": "token",
      "token": "c9c95f1ac23952152c018c5a2e6259f56830dba66292477b"
    },
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
    "trustedProxies": [
      "127.0.0.1",
      "::1"
    ]
  },
  "meta": {
    "lastTouchedVersion": "2026.2.25",
    "lastTouchedAt": "2026-02-26T08:29:45.443Z"
  }
}
EOFCONFIG

chown 1000:1000 /opt/openclaw/data/openclaw.json
echo "Config written. Content:"
cat /opt/openclaw/data/openclaw.json

echo ""
echo "---"
echo "Restarting container..."
docker restart openclaw
sleep 6

echo "---"
echo "Container status:"
docker ps --filter name=openclaw --format "{{.Status}}"

echo "---"
echo "Latest logs:"
docker logs --tail 15 openclaw 2>&1
