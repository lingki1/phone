# 数据库设置说明

## 问题描述

在开发环境中运行 `npm run dev` 时，用户数据库可能没有正确初始化，导致无法登录。

## 解决方案

### 1. 自动初始化（推荐）

项目已经配置了自动数据库初始化功能：

- 在开发环境中，数据库管理器会自动初始化数据库
- 系统会自动创建必要的表和默认用户
- 无需手动操作

### 2. 手动初始化

如果自动初始化失败，可以手动初始化数据库：

```powershell
# 方法1：使用PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/init" -Method POST

# 方法2：使用curl（如果安装了curl）
curl -X POST http://localhost:3000/api/init

# 方法3：在浏览器中访问
# 打开浏览器，访问 http://localhost:3000/api/init
```

### 3. 检查数据库状态

运行测试脚本检查数据库状态：

```powershell
node test-db.js
```

## 默认用户账户

系统会自动创建以下默认账户：

- **用户名**: `lingki`
- **密码**: `11111111`
- **角色**: `super_admin`

## 数据库文件位置

- **开发环境**: `./data/phone.db`
- **生产环境**: `/app/data/phone.db`

## 故障排除

### 1. 数据库文件不存在

确保 `data` 目录存在：

```powershell
# 创建data目录
mkdir -p data
```

### 2. 权限问题

确保应用有权限访问数据库文件：

```powershell
# 检查文件权限
Get-Acl data/phone.db
```

### 3. 端口占用

确保3000端口没有被其他应用占用：

```powershell
# 检查端口占用
netstat -an | findstr :3000
```

### 4. 重新启动开发服务器

如果问题持续存在，重新启动开发服务器：

```powershell
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

## 开发环境特性

- 数据库会在应用启动时自动初始化
- 控制台会显示初始化状态信息
- 如果初始化失败，应用仍会继续运行，但登录功能可能不可用

## 生产环境

在生产环境中，数据库初始化需要手动执行：

```bash
# Docker环境
docker exec -it <container_name> curl -X POST http://localhost:3000/api/init
```

## 注意事项

1. 数据库文件包含敏感信息，请妥善保管
2. 定期备份数据库文件
3. 在生产环境中修改默认密码
4. 确保数据库文件有适当的访问权限
