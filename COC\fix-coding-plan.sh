#!/bin/bash
set -e

# Test the correct Coding Plan endpoint first
echo "Testing Coding Plan API..."
curl -s https://coding.dashscope.aliyuncs.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-sp-e3bcd26f3ef04535895ce927faa22d44" \
  -d '{"model":"qwen-coder-plus-latest","messages":[{"role":"user","content":"Say hi"}]}'

echo ""
echo "---"

# Update docker-compose with correct endpoint
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
      # Alibaba Cloud Coding Plan endpoint
      - OPENAI_API_KEY=sk-sp-e3bcd26f3ef04535895ce927faa22d44
      - OPENAI_BASE_URL=https://coding.dashscope.aliyuncs.com/v1
    volumes:
      - /opt/openclaw/data:/home/node/.openclaw
EOFDOCKER

echo "Updated docker-compose.yml"

cd /opt/openclaw
docker compose down
docker compose up -d
sleep 8

echo "---"
echo "Container status:"
docker ps --filter name=openclaw --format "{{.Status}}"

echo "---"
echo "Gateway logs:"
docker logs --tail 10 openclaw 2>&1
