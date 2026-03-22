#!/bin/bash
echo "Testing GLM models..."
API_KEY="sk-sp-e3bcd26f3ef04535895ce927faa22d44"
URL="https://coding.dashscope.aliyuncs.com/v1/chat/completions"

for MODEL in "glm-5" "glm5" "glm-4.7" "glm4.7"; do
  echo -n "Testing $MODEL: "
  RESP=$(curl -s $URL \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"max_tokens\":5}" 2>&1)
  
  if echo "$RESP" | grep -q '"error"'; then
    echo "$RESP" | grep -o '"message":"[^"]*"' | head -1
  else
    echo "SUCCESS!"
  fi
done
