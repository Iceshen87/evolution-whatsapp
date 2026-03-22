#!/bin/bash
set -e

# Clean paired.json and set gateway.mode
docker exec openclaw node -e '
const fs = require("fs");

// Fix paired.json
const pairedPath = "/home/node/.openclaw/devices/paired.json";
const paired = JSON.parse(fs.readFileSync(pairedPath, "utf8"));
if (paired["undefined"]) {
  delete paired["undefined"];
  fs.writeFileSync(pairedPath, JSON.stringify(paired, null, 2));
  console.log("Cleaned undefined from paired.json");
}

// Fix config
const configPath = "/home/node/.openclaw/openclaw.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
if (!config.gateway.mode) {
  config.gateway.mode = "local";
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("Set gateway.mode = local");
}

// Create missing dirs
const sessionsDir = "/home/node/.openclaw/agents/main/sessions";
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
  console.log("Created sessions directory");
}
'

docker restart openclaw
sleep 6

echo "---"
echo "Gateway logs after restart:"
docker logs --tail 15 openclaw 2>&1
