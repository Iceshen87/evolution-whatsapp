#!/bin/bash
# Test DashScope API
curl -s https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-sp-e3bcd26f3ef04535895ce927faa22d44" \
  -d '{"model":"qwen-coder-plus-latest","messages":[{"role":"user","content":"Say hello"}]}'
