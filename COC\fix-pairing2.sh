#!/bin/bash
set -e

# Update paired.json with full fields from the pending request
docker exec openclaw node -e '
const fs = require("fs");
const pairedPath = "/home/node/.openclaw/devices/paired.json";
const pendingPath = "/home/node/.openclaw/devices/pending.json";

// Read pending to get full device info
let pending = {};
try { pending = JSON.parse(fs.readFileSync(pendingPath, "utf8")); } catch(e) {}

const deviceId = "950de24ebd73180d74101076872adce6e5b58a5c186819b97e16e77caeb8a88a";
const pubKey = "Slg0wz6j-UTr-7Wf8At9pVyPz9jmB58VOJP6mHODirA";

// Build paired entry with all fields
const paired = {};
paired[deviceId] = {
  publicKey: pubKey,
  name: "admin-browser",
  platform: "Win32",
  clientId: "openclaw-control-ui",
  clientMode: "webchat",
  role: "operator",
  roles: ["operator"],
  scopes: ["operator.admin", "operator.approvals", "operator.pairing"],
  pairedAt: Date.now(),
  approved: true,
  approvedAt: Date.now()
};

fs.writeFileSync(pairedPath, JSON.stringify(paired, null, 2));
console.log("Updated paired.json:", JSON.stringify(paired, null, 2));

// Clear pending
fs.writeFileSync(pendingPath, "{}");
console.log("Cleared pending.json");
'

echo "---"
echo "Restarting OpenClaw..."
docker restart openclaw
sleep 5

echo "---"
echo "Checking paired.json:"
cat /opt/openclaw/data/devices/paired.json

echo ""
echo "---"
echo "Recent logs:"
docker logs --tail 15 openclaw 2>&1
