#!/bin/bash

echo "🚀 开始项目更新..."

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull

if [ $? -ne 0 ]; then
    echo "❌ Git pull 失败，请检查网络连接或代码冲突"
    exit 1
fi

echo "✅ 代码更新完成"

# 2. 停止容器
echo "🛑 停止容器..."
docker compose -f docker-compose.simple.yml down

# 3. 检查是否需要权限修复
echo "🔍 检查数据目录权限..."
if [ ! -d "data" ] || [ ! -w "data" ]; then
    echo "⚠️  检测到权限问题，执行权限修复..."
    mkdir -p data logs
    sudo chown -R 1000:1000 data logs 2>/dev/null || chown -R 1000:1000 data logs
    sudo chmod -R 755 data logs 2>/dev/null || chmod -R 755 data logs
    echo "✅ 权限修复完成"
fi

# 4. 重新构建并启动
echo "🔨 重新构建并启动容器..."
docker compose -f docker-compose.simple.yml up -d --build

if [ $? -eq 0 ]; then
    echo "✅ 更新完成！"
    echo "📝 查看容器状态：docker ps"
    echo "📝 查看日志：docker logs phone-app"
else
    echo "❌ 容器启动失败，请检查日志"
    docker logs phone-app
fi
