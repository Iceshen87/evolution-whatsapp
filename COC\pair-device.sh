#!/bin/bash
set -e

echo "=== Registering device in paired.json ==="
docker exec openclaw node -e '
const fs = require("fs");
const p = "/home/node/.openclaw/devices/paired.json";
const paired = {
  "950de24ebd73180d74101076872adce6e5b58a5c186819b97e16e77caeb8a88a": {
    "publicKey": "Slg0wz6j-UTr-7Wf8At9pVyPz9jmB58VOJP6mHODirA",
    "name": "admin-browser",
    "pairedAt": Date.now()
  }
};
fs.writeFileSync(p, JSON.stringify(paired, null, 2));
console.log("Paired devices:");
console.log(JSON.stringify(paired, null, 2));
'

echo ""
echo "=== Restarting OpenClaw ==="
cd /opt/openclaw
docker compose restart
sleep 12

echo "=== Logs ==="
docker compose logs --tail=10
