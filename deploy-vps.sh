#!/bin/bash

# VPS一键部署脚本
# 使用方法: chmod +x deploy-vps.sh && ./deploy-vps.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署 Lingki-傻瓜机..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo "✅ Docker环境检查通过"

# 停止现有容器（如果存在）
echo "🛑 停止现有容器..."
docker compose -f docker-compose.simple.yml down 2>/dev/null || true

# 清理旧镜像（可选）
echo "🧹 清理旧镜像..."
docker image prune -f 2>/dev/null || true

# 确保目录存在
echo "📁 创建必要目录..."
sudo mkdir -p /home/ubuntu/data
sudo mkdir -p /home/ubuntu/logs

echo "🔧 设置目录权限..."
# 设置目录所有者为当前用户，避免权限问题
sudo chown -R $USER:$USER /home/ubuntu/data
sudo chown -R $USER:$USER /home/ubuntu/logs
sudo chmod -R 755 /home/ubuntu/data
sudo chmod -R 755 /home/ubuntu/logs

echo "🏗️ 开始构建和部署..."
# 使用docker compose部署
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.simple.yml up -d --build
else
    docker compose -f docker-compose.simple.yml up -d --build
fi

echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f docker-compose.simple.yml ps
else
    docker compose -f docker-compose.simple.yml ps
fi

# 显示日志
echo "📋 显示最近日志..."
docker logs phone-app --tail 20

echo ""
echo "🎉 部署完成！"
echo "📱 访问地址: http://$(curl -s ifconfig.me):3000"
echo "🔐 默认管理员账户: lingki / 11111111"
echo ""
echo "📊 查看日志: docker logs phone-app"
echo "🛑 停止服务: docker compose -f docker-compose.simple.yml down"
echo "🔄 重启服务: docker compose -f docker-compose.simple.yml restart"
echo ""
echo "💾 数据目录: /home/ubuntu/data"
echo "📝 日志目录: /home/ubuntu/logs"