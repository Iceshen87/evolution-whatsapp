#!/bin/bash
set -e

# Update docker-compose with opencode provider environment variables
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
      # Configure opencode provider with DashScope Coding Plan
      - OPENCODE_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
      - OPENCODE_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
    volumes:
      - /opt/openclaw/data:/home/node/.openclaw
EOFDOCKER

echo "Updated docker-compose.yml"

cd /opt/openclaw
docker compose down
docker compose up -d
sleep 6

# Set the model to opencode/glm-5
docker exec openclaw npx openclaw models set opencode/glm-5 2>&1 || true

docker restart openclaw
sleep 5

echo "---"
echo "Model status:"
docker exec openclaw npx openclaw models status 2>&1

echo "---"
echo "Gateway logs:"
docker logs --tail 10 openclaw 2>&1
