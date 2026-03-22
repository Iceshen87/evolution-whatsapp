#!/bin/bash
set -e

# Set the working model name
docker exec openclaw npx openclaw models set openai/qwen3-coder-plus 2>&1 || true

echo "---"
docker restart openclaw
sleep 6

echo "Model status:"
docker exec openclaw npx openclaw models status 2>&1

echo "---"
echo "Gateway logs:"
docker logs --tail 10 openclaw 2>&1
