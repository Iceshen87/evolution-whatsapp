#!/bin/bash
set -e

# Update docker-compose to use OpenAI-compatible API for DashScope
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
      # Use OpenAI-compatible endpoint for Alibaba Cloud DashScope (Singapore)
      - OPENAI_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
      - OPENAI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
    volumes:
      - /opt/openclaw/data:/home/node/.openclaw
EOFDOCKER

echo "Updated docker-compose.yml"
cat /opt/openclaw/docker-compose.yml

# Recreate container with new config
cd /opt/openclaw
docker compose down
docker compose up -d
sleep 8

# Configure Qwen model as default
docker exec openclaw npx openclaw models set openai/qwen-coder-plus-latest 2>&1 || true

echo "---"
echo "Model status:"
docker exec openclaw npx openclaw models status 2>&1

echo "---"
echo "Gateway logs:"
docker logs --tail 10 openclaw 2>&1
