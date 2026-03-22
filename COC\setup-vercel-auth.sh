#!/bin/bash
set -e

# Manually configure auth for vercel-ai-gateway provider
# First, let's check what providers are available
echo "Available providers:"
docker exec openclaw npx openclaw models auth login --provider vercel-ai-gateway 2>&1 || true

# Try pasting token directly
echo ""
echo "Trying to paste token for vercel-ai-gateway..."
echo "sk-sp-e3bcd26f3ef04535895ce927faa22d44" | docker exec -i openclaw npx openclaw models auth paste-token --provider vercel-ai-gateway 2>&1 || true

echo ""
echo "---"
echo "Model status after auth:"
docker exec openclaw npx openclaw models status 2>&1

# Let's also try writing directly to the auth-profiles.json
echo ""
echo "---"
echo "Writing auth profile directly..."
docker exec openclaw node -e '
const fs = require("fs");
const authPath = "/home/node/.openclaw/agents/main/agent/auth-profiles.json";

let auth = {};
try { auth = JSON.parse(fs.readFileSync(authPath, "utf8")); } catch(e) {}

auth["vercel-ai-gateway:manual"] = {
  type: "apiKey",
  key: "sk-sp-e3bcd26f3ef04535895ce927faa22d44",
  baseUrl: "https://coding.dashscope.aliyuncs.com/v1"
};

fs.writeFileSync(authPath, JSON.stringify(auth, null, 2));
console.log("Auth profile written:", Object.keys(auth));
'

docker restart openclaw
sleep 5

echo "---"
echo "Final model status:"
docker exec openclaw npx openclaw models status 2>&1

echo "---"
echo "Gateway logs:"
docker logs --tail 10 openclaw 2>&1
