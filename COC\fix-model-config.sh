#!/bin/bash
set -e

# Configure OpenClaw to use DashScope with proper model settings
docker exec openclaw node -e '
const fs = require("fs");
const configPath = "/home/node/.openclaw/openclaw.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Configure model with DashScope settings
config.agents = config.agents || {};
config.agents.defaults = config.agents.defaults || {};
config.agents.defaults.model = {
  primary: "openai/gpt-4o"
};
config.agents.defaults.models = {
  "openai/gpt-4o": {
    apiModelId: "qwen-coder-plus-latest"
  }
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("Config updated with apiModelId mapping");
console.log(JSON.stringify(config.agents, null, 2));
'

docker restart openclaw
sleep 6

echo "---"
echo "Model status:"
docker exec openclaw npx openclaw models status 2>&1

echo "---"
echo "Gateway logs:"
docker logs --tail 10 openclaw 2>&1
