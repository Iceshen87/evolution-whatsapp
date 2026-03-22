#!/bin/bash
set -e

# Configure OpenAI provider to use DashScope with correct model name mapping
# Using auth profile to set custom base URL

# First, update docker-compose to use OPENAI env vars
cat > /opt/openclaw/docker-compose.yml << 'EOFDOCKER'
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    container_name: openclaw
    restart: unless-stopped
    network_mode: host
    user: "1000:1000"
    environment:
      - OPENCLAW_GATEWAY_PORT=18790
      - OPENAI_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
      - OPENAI_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
    volumes:
      - /opt/openclaw/data:/home/node/.openclaw
EOFDOCKER

cd /opt/openclaw
docker compose down
docker compose up -d
sleep 6

# Configure model alias: when OpenClaw uses openai/gpt-4o, it will call the API
# Since we set OPENAI_BASE_URL to DashScope, and DashScope accepts gpt-4o mapped to their models
# Actually let's try setting the model directly

# Remove old aliases and set fresh config
docker exec openclaw node -e '
const fs = require("fs");
const configPath = "/home/node/.openclaw/openclaw.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Set model to use OpenAI provider with a specific model that DashScope maps
config.agents = config.agents || {};
config.agents.defaults = config.agents.defaults || {};
config.agents.defaults.model = {
  primary: "openai/gpt-4o"
};
// Clear aliases
config.agents.defaults.modelAliases = {};
config.agents.defaults.models = {
  "openai/gpt-4o": {}
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("Config updated");
'

docker restart openclaw
sleep 5

echo "---"
echo "Testing if DashScope accepts gpt-4o model name..."
curl -s https://coding.dashscope.aliyuncs.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-sp-e3bcd26f3ef04535895ce927faa22d44" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}],"max_tokens":5}'

echo ""
echo "---"
echo "Gateway logs:"
docker logs --tail 10 openclaw 2>&1
