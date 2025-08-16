# Docker 部署指南

## 快速开始

### 1. 安装Docker和Docker Compose

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将用户添加到docker组（可选）
sudo usermod -aG docker $USER
```

### 2. 克隆项目

```bash
git clone https://github.com/lingki1/phone.git
cd phone
```

### 3. 部署应用

#### 方式一：使用部署脚本（推荐）

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

#### 方式二：手动部署

```bash
# 1. 创建数据目录（重要！）
mkdir -p data logs

# 2. 确保目录权限
chmod 755 data logs

# 3. 构建并启动容器
docker compose -f docker-compose.simple.yml up -d --build

# 4. 查看日志
docker compose -f docker-compose.simple.yml logs -f
```

**📝 重要说明：** 现在您的聊天室JSON数据文件会保存在主机的 `data/` 目录中，即使Docker容器重建也不会丢失！

### 4. 访问应用

- 本地访问：http://localhost:3000
- 外网访问：http://你的服务器IP:3000

## 部署选项

### 简单部署（推荐）

使用 `docker-compose.simple.yml`，只包含应用服务：

```bash
docker-compose -f docker-compose.simple.yml up -d
```

### 完整部署

使用 `docker-compose.yml`，包含Nginx反向代理：

```bash
# 创建必要的目录
mkdir -p logs ssl

# 启动所有服务
docker-compose up -d
```

## 管理命令

### 查看容器状态

```bash
docker-compose -f docker-compose.simple.yml ps
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.simple.yml logs

# 查看特定服务日志
docker-compose -f docker-compose.simple.yml logs phone-app

# 实时查看日志
docker-compose -f docker-compose.simple.yml logs -f
```

### 停止服务

```bash
docker-compose -f docker-compose.simple.yml down
```

### 重启服务

```bash
docker-compose -f docker-compose.simple.yml restart
```

### 更新应用

```bash
# 拉取最新代码
git pull origin master

# 重新部署
./deploy.sh
```

## 配置说明

### 环境变量

可以在 `docker-compose.simple.yml` 中修改环境变量：

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - HOSTNAME=0.0.0.0
```

### 端口配置

默认端口为3000，可以修改：

```yaml
ports:
  - "8080:3000"  # 将主机的8080端口映射到容器的3000端口
```

### 数据持久化

**重要：** 为了防止Docker重建时丢失数据，已经配置了数据卷挂载：

```yaml
volumes:
  - ./data:/app/data    # 持久化聊天室JSON文件和SQLite数据库
  - ./logs:/app/logs    # 持久化日志文件（可选）
```

#### 数据文件说明

`data/` 目录包含以下重要文件：
- `chatroom-messages.json` - 公共聊天室消息数据
- `chatroom-users.json` - 公共聊天室用户数据  
- `phone.db` - SQLite数据库（如果使用）
- 其他应用数据文件

#### 首次部署前准备

```bash
# 创建数据目录（如果不存在）
mkdir -p data logs

# 确保目录权限正确
chmod 755 data logs
```

## 故障排除

### 1. 端口被占用

```bash
# 查看端口占用
sudo netstat -tulpn | grep :3000

# 杀死占用进程
sudo kill -9 <PID>
```

### 2. 容器启动失败

```bash
# 查看容器日志
docker-compose -f docker-compose.simple.yml logs phone-app

# 检查容器状态
docker ps -a
```

### 3. 构建失败

```bash
# 清理Docker缓存
docker system prune -a

# 重新构建
docker-compose -f docker-compose.simple.yml build --no-cache
```

### 4. 网络问题

```bash
# 检查网络配置
docker network ls
docker network inspect phone_phone-network
```

## 安全配置

### 1. 防火墙设置

```bash
# 开放3000端口
sudo ufw allow 3000

# 如果使用Nginx，开放80端口
sudo ufw allow 80
```

### 2. 云服务器安全组

确保在云服务器控制台中开放相应端口：
- 3000端口（直接访问）
- 80端口（使用Nginx时）

## 性能优化

### 1. 资源限制

在 `docker-compose.simple.yml` 中添加资源限制：

```yaml
services:
  phone-app:
    # ... 其他配置
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. 健康检查

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## 监控和维护

### 1. 查看资源使用

```bash
docker stats
```

### 2. 数据备份与恢复

#### 备份数据
```bash
# 创建备份目录
mkdir -p backup/$(date +%Y%m%d_%H%M%S)

# 备份数据文件（推荐方法 - 直接复制主机目录）
cp -r data backup/$(date +%Y%m%d_%H%M%S)/

# 或者从容器中备份（如果容器正在运行）
docker cp phone-app:/app/data backup/$(date +%Y%m%d_%H%M%S)/data
```

#### 恢复数据
```bash
# 停止容器
docker-compose -f docker-compose.simple.yml down

# 恢复数据文件
cp -r backup/20231219_143000/data/* ./data/

# 重新启动容器
docker-compose -f docker-compose.simple.yml up -d
```

#### 自动备份脚本

**Windows PowerShell 用户：**
```powershell
# 运行备份脚本
./backup.ps1

# 查看备份列表
Get-ChildItem backup/ -Directory | Sort-Object Name -Descending

# 恢复特定备份
./restore.ps1 20231219_143000
```

**Linux/macOS 用户：**
创建 `backup.sh` 脚本：
```bash
#!/bin/bash
BACKUP_DIR="backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r data "$BACKUP_DIR/"
echo "数据已备份到: $BACKUP_DIR"

# 清理7天前的备份
find backup/ -type d -mtime +7 -exec rm -rf {} +
```

### 3. 更新镜像

```bash
# 拉取最新代码
git pull origin master

# 重新构建和部署
./deploy.sh
```

## 支持

如果遇到问题，请：

1. 查看容器日志
2. 检查网络配置
3. 确认防火墙设置
4. 提交Issue到GitHub仓库 