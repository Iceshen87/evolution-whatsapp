#!/bin/bash
set -e

# Update config using node inside the container
docker exec openclaw node -e '
const fs = require("fs");
const p = "/home/node/.openclaw/openclaw.json";
const c = JSON.parse(fs.readFileSync(p,"utf8"));
c.gateway.controlUi = {
  allowedOrigins: ["http://43.106.117.4:18789"],
  dangerouslyAllowHostHeaderOriginFallback: true
};
fs.writeFileSync(p, JSON.stringify(c, null, 2));
console.log("Config updated:");
console.log(JSON.stringify(c, null, 2));
'

echo ""
echo "=== Restarting OpenClaw ==="
cd /opt/openclaw
docker compose restart
sleep 12

echo "=== Status ==="
docker compose ps
docker compose logs --tail=15

echo ""
echo "=== Test ==="
curl -s -o /dev/null -w "HTTP: %{http_code}\n" --max-time 5 http://127.0.0.1:18789/
