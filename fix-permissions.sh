#!/bin/bash

# 权限修复脚本
# 用于修复Docker容器内数据目录的权限问题

echo "🔧 修复数据目录权限..."

# 确保数据目录存在
mkdir -p /app/data /app/logs

# 设置正确的权限
chown -R node:node /app/data /app/logs
chmod -R 755 /app/data /app/logs

# 如果数据文件已存在，确保它们属于node用户
if [ -f /app/data/chatroom-messages.json ]; then
    chown node:node /app/data/chatroom-messages.json
    chmod 644 /app/data/chatroom-messages.json
fi

if [ -f /app/data/chatroom-users.json ]; then
    chown node:node /app/data/chatroom-users.json
    chmod 644 /app/data/chatroom-users.json
fi

if [ -f /app/data/phone.db ]; then
    chown node:node /app/data/phone.db
    chmod 644 /app/data/phone.db
fi

echo "✅ 权限修复完成"
