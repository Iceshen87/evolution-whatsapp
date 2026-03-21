#!/bin/bash
# 修复后端数据库问题

echo "修复后端数据库..."

# 删除旧的数据库文件
docker exec evolution-whatsapp-backend-1 rm -f /app/data/app.db

# 等待一下
sleep 2

# 重新启动后端，它会自动创建数据库和表
docker restart evolution-whatsapp-backend-1

echo "等待后端启动..."
sleep 10

# 检查日志
docker compose -f /opt/evolution-whatsapp/docker-compose.light.yml logs --tail=15 backend

echo ""
echo "修复完成！请刷新页面重试登录。"
echo "账号: admin"
echo "密码: Admin@20260321"
