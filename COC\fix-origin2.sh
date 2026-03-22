#!/bin/bash
set -e

# Update openclaw.json with broader allowedOrigins including wildcard
docker exec openclaw node -e '
const fs = require("fs");
const configPath = "/home/node/.openclaw/openclaw.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

config.gateway.controlUi = {
  allowedOrigins: [
    "https://43.106.117.4:18789",
    "http://43.106.117.4:18789",
    "https://43.106.117.4",
    "http://43.106.117.4"
  ],
  dangerouslyAllowHostHeaderOriginFallback: true,
  allowInsecureAuth: true,
  allowAllOrigins: true
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("Config updated:");
console.log(JSON.stringify(config.gateway.controlUi, null, 2));
'

echo "---"
echo "Restarting OpenClaw..."
docker restart openclaw
sleep 5

echo "---"
echo "Checking config:"
cat /opt/openclaw/data/openclaw.json

echo ""
echo "---"
echo "Latest logs:"
docker logs --tail 10 openclaw 2>&1
