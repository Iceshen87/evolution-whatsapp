#!/bin/bash
# 修复 Evolution API 数据库问题

echo "检查环境变量..."
cat /opt/evolution-whatsapp/.env | grep -E "(POSTGRES|EVOLUTION)"

echo ""
echo "重启 PostgreSQL 确保密码正确..."
docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml restart postgres
sleep 5

echo ""
echo "检查 PostgreSQL 日志..."
docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml logs --tail=10 postgres

echo ""
echo "重启 Evolution API..."
docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml restart evolution-api
sleep 10

echo ""
echo "检查 Evolution API 状态..."
docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml ps evolution-api
docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml logs --tail=15 evolution-api

echo ""
echo "修复完成！"
