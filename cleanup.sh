#!/bin/bash

# Evolution WhatsApp 清理脚本
# 只清理本项目文件，不影响 OpenClash 和其他服务

set -e

echo "========================================"
echo "  Evolution WhatsApp 清理脚本"
echo "========================================"
echo ""

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then 
    echo "请使用 root 权限运行此脚本"
    exit 1
fi

PROJECT_DIR="/opt/evolution-whatsapp"

echo "[1/5] 停止并删除 Docker 容器..."
if [ -f "$PROJECT_DIR/docker-compose.light.yml" ]; then
    cd $PROJECT_DIR
    docker-compose -f docker-compose.light.yml down --volumes --remove-orphans 2>/dev/null || true
    echo "  Docker 容器已停止并删除"
else
    # 尝试停止可能运行的容器
    docker stop evolution-whatsapp-nginx evolution-whatsapp-backend evolution-whatsapp-frontend evolution-whatsapp-evolution-api evolution-whatsapp-postgres evolution-whatsapp-redis 2>/dev/null || true
    docker rm evolution-whatsapp-nginx evolution-whatsapp-backend evolution-whatsapp-frontend evolution-whatsapp-evolution-api evolution-whatsapp-postgres evolution-whatsapp-redis 2>/dev/null || true
    echo "  相关容器已清理"
fi

echo ""
echo "[2/5] 删除 Docker 镜像..."
docker rmi evolution-whatsapp-backend evolution-whatsapp-frontend atendai/evolution-api:latest 2>/dev/null || true
docker image prune -f 2>/dev/null || true
echo "  镜像已清理"

echo ""
echo "[3/5] 删除项目文件..."
if [ -d "$PROJECT_DIR" ]; then
    rm -rf $PROJECT_DIR
    echo "  项目目录已删除: $PROJECT_DIR"
fi

# 删除可能下载的脚本
rm -f /root/deploy.sh /tmp/deploy.sh 2>/dev/null || true
echo "  临时文件已清理"

echo ""
echo "[4/5] 删除 Swap 文件（可选）..."
if [ -f /swapfile ]; then
    swapoff /swapfile 2>/dev/null || true
    sed -i '/swapfile/d' /etc/fstab
    rm -f /swapfile
    echo "  Swap 文件已删除"
else
    echo "  未找到 Swap 文件，跳过"
fi

echo ""
echo "[5/5] 检查 OpenClash 状态..."
if systemctl is-active --quiet openclash 2>/dev/null || docker ps | grep -q openclash; then
    echo "  ✅ OpenClash 运行正常，未受影响"
else
    echo "  ⚠️  OpenClash 未运行，请检查"
fi

echo ""
echo "========================================"
echo "  清理完成！"
echo "========================================"
echo ""
echo "以下内容已删除："
echo "  - Docker 容器 (evolution-whatsapp 相关)"
echo "  - Docker 镜像 (evolution-whatsapp 相关)"
echo "  - 项目文件 (/opt/evolution-whatsapp)"
echo "  - Swap 文件 (如果存在)"
echo ""
echo "以下内容保留："
echo "  - OpenClash 服务"
echo "  - 其他 Docker 容器和镜像"
echo "  - 系统配置"
echo ""
echo "如需重新部署，请运行："
echo "  curl -fsSL https://raw.githubusercontent.com/Iceshen87/evolution-whatsapp/main/deploy.sh | bash"
echo ""

