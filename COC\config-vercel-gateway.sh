#!/bin/bash
set -e

# Update docker-compose to use vercel-ai-gateway with DashScope endpoint
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
      # Vercel AI Gateway config pointing to DashScope Coding Plan
      - VERCEL_AI_GATEWAY_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
      - VERCEL_AI_GATEWAY_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
    volumes:
      - /opt/openclaw/data:/home/node/.openclaw
EOFDOCKER

cd /opt/openclaw
docker compose down
docker compose up -d
sleep 6

# Set model to vercel-ai-gateway/alibaba/qwen3-coder-plus
docker exec openclaw npx openclaw models set vercel-ai-gateway/alibaba/qwen3-coder-plus 2>&1

docker restart openclaw
sleep 5

echo "---"
echo "Model status:"
docker exec openclaw npx openclaw models status 2>&1

echo "---"
echo "Gateway logs:"
docker logs --tail 15 openclaw 2>&1
