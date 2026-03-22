#!/bin/bash

# Evolution WhatsApp 管理平台 - 轻量版部署脚本
# 适用于 2GB 内存服务器

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Evolution WhatsApp 管理平台部署脚本${NC}"
echo -e "${GREEN}  轻量版 - 适用于 2GB 内存服务器${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 root 权限运行此脚本${NC}"
    exit 1
fi

# 系统信息
echo -e "${YELLOW}[1/8] 检查系统配置...${NC}"
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
echo "  总内存: ${TOTAL_MEM}MB"
if [ $TOTAL_MEM -lt 2048 ]; then
    echo -e "${RED}  警告: 内存不足 2GB，可能影响性能${NC}"
fi

# 添加 Swap
echo -e "${YELLOW}[2/8] 配置 Swap 空间...${NC}"
if [ ! -f /swapfile ]; then
    echo "  创建 2GB Swap..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${GREEN}  Swap 创建成功${NC}"
else
    echo -e "${GREEN}  Swap 已存在${NC}"
fi
swapon --show

# 安装 Docker
echo -e "${YELLOW}[3/8] 安装 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}  Docker 安装成功${NC}"
else
    echo -e "${GREEN}  Docker 已安装${NC}"
fi

# 安装 Docker Compose
echo -e "${YELLOW}[4/8] 安装 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    apt-get update
    apt-get install -y docker-compose-plugin
    ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
    echo -e "${GREEN}  Docker Compose 安装成功${NC}"
else
    echo -e "${GREEN}  Docker Compose 已安装${NC}"
fi

# 克隆项目
echo -e "${YELLOW}[5/8] 下载项目代码...${NC}"
PROJECT_DIR="/opt/evolution-whatsapp"
if [ ! -d "$PROJECT_DIR" ]; then
    git clone https://github.com/Iceshen87/evolution-whatsapp.git $PROJECT_DIR
    echo -e "${GREEN}  项目克隆成功${NC}"
else
    cd $PROJECT_DIR
    git pull
    echo -e "${GREEN}  项目已更新${NC}"
fi
cd $PROJECT_DIR

# 配置环境变量
echo -e "${YELLOW}[6/8] 配置环境变量...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    
    # 生成随机密钥
    JWT_SECRET=$(openssl rand -hex 32)
    EVOLUTION_KEY=$(openssl rand -hex 16)
    POSTGRES_PASS=$(openssl rand -hex 16)
    ADMIN_PASS=$(openssl rand -hex 8)
    
    # 更新 .env 文件
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/EVOLUTION_API_KEY=.*/EVOLUTION_API_KEY=$EVOLUTION_KEY/" .env
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASS/" .env
    sed -i "s/ADMIN_PASSWORD=.*/ADMIN_PASSWORD=$ADMIN_PASS/" .env
    sed -i "s/DOMAIN=.*/DOMAIN=8.222.213.209/" .env
    sed -i "s/EVOLUTION_SERVER_URL=.*/EVOLUTION_SERVER_URL=http:\/\/8.222.213.209:8080/" .env
    
    echo -e "${GREEN}  环境变量配置成功${NC}"
    echo ""
    echo -e "${YELLOW}  请记录以下信息：${NC}"
    echo "  管理员账号: admin"
    echo "  管理员密码: $ADMIN_PASS"
    echo "  Evolution API Key: $EVOLUTION_KEY"
    echo ""
else
    echo -e "${GREEN}  环境变量已配置${NC}"
fi

# 启动服务
echo -e "${YELLOW}[7/8] 启动服务（分阶段）...${NC}"

# 阶段1: 启动数据库
echo "  阶段1: 启动数据库..."
docker-compose -f docker-compose.light.yml up -d postgres redis
sleep 10

# 阶段2: 启动 Evolution API
echo "  阶段2: 启动 Evolution API..."
docker-compose -f docker-compose.light.yml up -d evolution-api
sleep 15

# 阶段3: 启动后端和前端
echo "  阶段3: 启动后端和前端..."
docker-compose -f docker-compose.light.yml up -d backend frontend nginx

echo -e "${GREEN}  所有服务已启动${NC}"

# 检查状态
echo -e "${YELLOW}[8/8] 检查服务状态...${NC}"
sleep 5
docker-compose -f docker-compose.light.yml ps

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "  访问地址:"
echo "    管理后台: http://8.222.213.209"
echo "    Evolution API: http://8.222.213.209:8080"
echo ""
echo "  查看日志:"
echo "    docker-compose -f docker-compose.light.yml logs -f"
echo ""
echo "  监控内存:"
echo "    docker stats"
echo "    free -h"
echo ""
