#!/bin/bash
# Evolution WhatsApp 一键部署脚本 - 新服务器
# 服务器: 8.222.170.254

set -e

echo "========================================"
echo "  Evolution WhatsApp 管理平台"
echo "  一键部署脚本 v2.0"
echo "========================================"
echo ""

# 配置
SERVER_IP="8.222.170.254"
PROJECT_DIR="/opt/evolution-whatsapp"

# 检查 root
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 root 权限运行: sudo ./deploy.sh"
    exit 1
fi

echo "[1/7] 检查系统..."
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
echo "  内存: ${TOTAL_MEM}MB"
cat /etc/os-release | grep "^PRETTY_NAME" | cut -d'"' -f2

echo ""
echo "[2/7] 配置 Swap..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "  Swap 2GB 已创建"
else
    echo "  Swap 已存在"
fi

echo ""
echo "[3/7] 安装 Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "  Docker 已安装"
else
    echo "  Docker 已安装"
fi

echo ""
echo "[4/7] 安装 Docker Compose..."
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    apt-get update
    apt-get install -y docker-compose-plugin
    echo "  Docker Compose 已安装"
else
    echo "  Docker Compose 已安装"
fi

echo ""
echo "[5/7] 下载项目..."
if [ ! -d "$PROJECT_DIR" ]; then
    git clone https://github.com/Iceshen87/evolution-whatsapp.git $PROJECT_DIR
fi
cd $PROJECT_DIR
echo "  项目已下载"

echo ""
echo "[6/7] 配置环境变量..."
if [ ! -f .env ]; then
    cp .env.example .env
    
    # 生成随机密钥
    JWT_SECRET=$(openssl rand -hex 32)
    EVOLUTION_KEY=$(openssl rand -hex 16)
    POSTGRES_PASS=$(openssl rand -hex 16)
    ADMIN_PASS="Admin@$(date +%Y%m%d)"
    
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/EVOLUTION_API_KEY=.*/EVOLUTION_API_KEY=$EVOLUTION_KEY/" .env
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASS/" .env
    sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASS/" .env
    sed -i "s/DOMAIN=.*/DOMAIN=$SERVER_IP/" .env
    sed -i "s|EVOLUTION_SERVER_URL=.*|EVOLUTION_SERVER_URL=http://$SERVER_IP:8080|" .env
    
    echo ""
    echo "========================================"
    echo "  请记录以下登录信息："
    echo "========================================"
    echo "  管理员账号: admin"
    echo "  管理员密码: $ADMIN_PASS"
    echo "  Evolution API Key: $EVOLUTION_KEY"
    echo "========================================"
    echo ""
fi

echo ""
echo "[7/7] 启动服务（分阶段）..."
echo "  阶段1: 数据库..."
docker compose -f docker-compose.light.yml up -d postgres redis
sleep 10

echo "  阶段2: Evolution API..."
docker compose -f docker-compose.light.yml up -d evolution-api
sleep 15

echo "  阶段3: 全部服务..."
docker compose -f docker-compose.light.yml up -d backend frontend nginx

sleep 5

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "  访问地址:"
echo "  管理后台: http://$SERVER_IP"
echo "  Evolution API: http://$SERVER_IP:8080"
echo ""
echo "  查看状态: docker compose -f $PROJECT_DIR/docker-compose.light.yml ps"
echo "  查看日志: docker compose -f $PROJECT_DIR/docker-compose.light.yml logs -f"
echo "  监控资源: docker stats"
echo ""
