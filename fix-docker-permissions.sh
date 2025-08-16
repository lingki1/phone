#!/bin/bash

echo "🔧 修复Docker数据目录权限..."

# 停止容器
echo "停止容器..."
docker compose -f docker-compose.simple.yml down

# 创建数据目录（如果不存在）
echo "创建数据目录..."
mkdir -p data logs

# 设置正确的权限
echo "设置目录权限..."
sudo chown -R 1000:1000 data logs
sudo chmod -R 755 data logs

# 如果数据文件已存在，修复权限
if [ -f data/chatroom-messages.json ]; then
    sudo chown 1000:1000 data/chatroom-messages.json
    sudo chmod 644 data/chatroom-messages.json
    echo "✅ 修复 chatroom-messages.json 权限"
fi

if [ -f data/chatroom-users.json ]; then
    sudo chown 1000:1000 data/chatroom-users.json
    sudo chmod 644 data/chatroom-users.json
    echo "✅ 修复 chatroom-users.json 权限"
fi

if [ -f data/phone.db ]; then
    sudo chown 1000:1000 data/phone.db
    sudo chmod 644 data/phone.db
    echo "✅ 修复 phone.db 权限"
fi

# 重新构建并启动容器
echo "重新构建并启动容器..."
docker compose -f docker-compose.simple.yml up -d --build

echo "✅ 权限修复完成！"
echo "📝 检查容器日志：docker logs phone-app"
