#!/bin/bash
set -e

echo "=== Updating config to fix pairing ==="
docker exec openclaw node -e '
const fs = require("fs");
const p = "/home/node/.openclaw/openclaw.json";
const c = JSON.parse(fs.readFileSync(p,"utf8"));
c.gateway.controlUi = {
  allowedOrigins: ["https://43.106.117.4:18789"],
  dangerouslyAllowHostHeaderOriginFallback: true,
  allowInsecureAuth: true
};
c.gateway.trustedProxies = ["127.0.0.1", "::1"];
fs.writeFileSync(p, JSON.stringify(c, null, 2));
console.log(JSON.stringify(c, null, 2));
'

echo "=== Restarting ==="
cd /opt/openclaw
docker compose restart
sleep 12

echo "=== Logs ==="
docker compose logs --tail=10
