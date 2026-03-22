#!/bin/bash
set -e

# Try configuring model with baseUrl in the config
docker exec openclaw node -e '
const fs = require("fs");
const configPath = "/home/node/.openclaw/openclaw.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

// Try setting baseUrl directly in model config
config.agents = config.agents || {};
config.agents.defaults = config.agents.defaults || {};
config.agents.defaults.model = {
  primary: "openai/gpt-4o"
};
config.agents.defaults.models = {
  "openai/gpt-4o": {
    baseUrl: "https://coding.dashscope.aliyuncs.com/v1",
    modelOverride: "qwen3-coder-plus"
  }
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("Config written");
console.log(JSON.stringify(config.agents.defaults, null, 2));
'

docker restart openclaw
sleep 5

echo "---"
docker logs --tail 20 openclaw 2>&1 | grep -iE '(error|invalid|model|config)'
