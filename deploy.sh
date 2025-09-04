#!/bin/bash

# 设置部署版本号（使用当前时间戳）
export DEPLOY_VERSION=$(date +%s)

echo "🚀 开始部署应用..."
echo "📅 部署版本: $DEPLOY_VERSION"

# 停止现有容器
echo "🛑 停止现有容器..."
docker compose -f docker-compose.simple.yml down

# 重新构建并启动
echo "🔨 重新构建并启动容器..."
docker compose -f docker-compose.simple.yml up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "✅ 检查服务状态..."
docker compose -f docker-compose.simple.yml ps

echo "🎉 部署完成！"
echo "📅 部署版本: $DEPLOY_VERSION"
echo "🌐 应用地址: http://localhost:3000"
echo ""
echo "💡 注意：由于部署版本已更新，所有用户需要重新登录"