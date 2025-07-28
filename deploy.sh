#!/bin/bash

# 部署脚本
echo "🚀 开始部署Phone应用..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose -f docker-compose.simple.yml down

# 删除旧镜像
echo "🗑️ 删除旧镜像..."
docker rmi phone-app:latest 2>/dev/null || true

# 构建新镜像
echo "🔨 构建新镜像..."
docker-compose -f docker-compose.simple.yml build --no-cache

# 启动容器
echo "🚀 启动容器..."
docker-compose -f docker-compose.simple.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 部署成功！"
    echo "🌐 应用地址: http://localhost:3000"
    echo "🌐 外网地址: http://$(curl -s ifconfig.me):3000"
else
    echo "❌ 部署失败，请检查日志"
    docker-compose -f docker-compose.simple.yml logs
    exit 1
fi

# 显示容器状态
echo "📊 容器状态:"
docker-compose -f docker-compose.simple.yml ps

echo "🎉 部署完成！" 