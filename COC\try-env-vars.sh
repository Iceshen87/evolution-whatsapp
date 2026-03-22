#!/bin/bash
set -e

# Try different env var names for vercel-ai-gateway
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
      # Try multiple env var names
      - VERCEL_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
      - VERCEL_AI_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
      - ALIBABA_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
      - DASHSCOPE_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
    volumes:
      - /opt/openclaw/data:/home/node/.openclaw
EOFDOCKER

cd /opt/openclaw
docker compose down
docker compose up -d
sleep 6

echo "Model status:"
docker exec openclaw npx openclaw models status 2>&1

echo "---"
echo "Gateway logs:"
docker logs --tail 10 openclaw 2>&1
