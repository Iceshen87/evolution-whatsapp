#!/bin/bash
# 修复 PostgreSQL 数据库用户

POSTGRES_PASS="da3646ae048a2de4d2d11349b33b1413"

echo "创建 PostgreSQL 用户..."
docker exec evolution-whatsapp-postgres-1 psql -U postgres -c "DROP USER IF EXISTS evolution;"
docker exec evolution-whatsapp-postgres-1 psql -U postgres -c "CREATE USER evolution WITH PASSWORD '$POSTGRES_PASS';"
docker exec evolution-whatsapp-postgres-1 psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE evolution TO evolution;"
docker exec evolution-whatsapp-postgres-1 psql -U postgres -c "ALTER DATABASE evolution OWNER TO evolution;"
docker exec evolution-whatsapp-postgres-1 psql -U postgres -c "ALTER USER evolution WITH SUPERUSER;"

echo ""
echo "重启 Evolution API..."
docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml restart evolution-api

sleep 15

echo ""
echo "检查状态..."
docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml ps evolution-api
docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml logs --tail=20 evolution-api
