#!/bin/bash
docker exec openclaw node -e '
const fs = require("fs");
const p = "/home/node/.openclaw/devices/paired.json";
const d = JSON.parse(fs.readFileSync(p));
if (d["undefined"]) {
  delete d["undefined"];
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
  console.log("Removed undefined key");
}
console.log("Paired devices:", Object.keys(d).length);
for (const [k,v] of Object.entries(d)) {
  console.log(" -", v.name || v.clientId, k.substring(0,20) + "...");
}
'
