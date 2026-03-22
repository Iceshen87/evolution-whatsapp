#!/bin/bash
set -e

# Approve any pending device pairing requests
docker exec openclaw node -e '
const fs = require("fs");
const pairedPath = "/home/node/.openclaw/devices/paired.json";
const pendingPath = "/home/node/.openclaw/devices/pending.json";

let paired = {};
try { paired = JSON.parse(fs.readFileSync(pairedPath, "utf8")); } catch(e) {}

let pending = {};
try { pending = JSON.parse(fs.readFileSync(pendingPath, "utf8")); } catch(e) {}

// Approve all pending requests
for (const [reqId, req] of Object.entries(pending)) {
  if (req.deviceId && !paired[req.deviceId]) {
    paired[req.deviceId] = {
      publicKey: req.publicKey,
      name: req.clientId || "auto-approved",
      platform: req.platform,
      clientId: req.clientId,
      clientMode: req.clientMode,
      role: req.role,
      roles: req.roles,
      scopes: req.scopes,
      pairedAt: Date.now(),
      approved: true,
      approvedAt: Date.now()
    };
    console.log("Approved device:", req.deviceId.substring(0, 16) + "...");
  }
}

fs.writeFileSync(pairedPath, JSON.stringify(paired, null, 2));
fs.writeFileSync(pendingPath, "{}");
console.log("All pending devices approved. Total paired:", Object.keys(paired).length);
'

echo "---"
echo "Current paired devices:"
docker exec openclaw node -e 'const p = JSON.parse(require("fs").readFileSync("/home/node/.openclaw/devices/paired.json")); for(const [k,v] of Object.entries(p)) console.log("-", v.name || v.clientId, "("+k.substring(0,16)+"...)");'
