#!/bin/bash
set -e

# Fix invalid config key and use only valid options
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
  allowInsecureAuth: true
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("Config fixed - removed allowAllOrigins");
console.log(JSON.stringify(config.gateway.controlUi, null, 2));
'

echo "---"
docker restart openclaw
sleep 5

echo "---"
docker logs --tail 10 openclaw 2>&1
