#!/bin/bash
set -e

# Clean up the "undefined" key in paired.json
docker exec openclaw node -e '
const fs = require("fs");
const p = "/home/node/.openclaw/devices/paired.json";
const data = JSON.parse(fs.readFileSync(p, "utf8"));
if (data["undefined"]) {
  delete data["undefined"];
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
  console.log("Removed undefined entry");
} else {
  console.log("No undefined entry found");
}
console.log("Current paired.json keys:", Object.keys(data));
'

echo "---"
echo "Latest logs:"
docker logs --tail 10 openclaw 2>&1
