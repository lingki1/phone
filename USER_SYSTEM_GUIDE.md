# 用户系统使用指南

## 概述

本项目已集成完整的用户系统，支持用户注册、登录、权限管理和分组管理功能。系统使用SQLite数据库存储用户数据，支持Docker部署和本地开发。

## 功能特性

### 1. 用户角色系统
- **超级管理员 (super_admin)**: 拥有所有权限，可以管理其他管理员
- **管理员 (admin)**: 可以管理用户和分组
- **普通用户 (user)**: 基础用户权限

### 2. 用户分组系统
- 支持自定义分组管理
- 所有用户默认分配到"默认分组"
- 管理员可以创建、编辑、删除分组
- 删除分组时，该分组下的用户会自动移动到默认分组

### 3. 认证系统
- JWT Token认证
- 密码加密存储 (bcrypt)
- 会话管理
- 自动清理过期会话

## 数据库设计

### 用户表 (users)
```sql
CREATE TABLE users (
  uid TEXT PRIMARY KEY,                    -- 用户唯一ID
  username TEXT UNIQUE NOT NULL,           -- 用户名
  password TEXT NOT NULL,                  -- 加密密码
  role TEXT NOT NULL DEFAULT 'user',       -- 用户角色
  group_id TEXT NOT NULL DEFAULT 'default', -- 分组ID
  created_at TEXT NOT NULL,                -- 创建时间
  updated_at TEXT NOT NULL,                -- 更新时间
  last_login TEXT,                         -- 最后登录时间
  avatar TEXT,                             -- 头像
  email TEXT                               -- 邮箱
);
```

### 用户分组表 (user_groups)
```sql
CREATE TABLE user_groups (
  id TEXT PRIMARY KEY,                     -- 分组ID
  name TEXT UNIQUE NOT NULL,               -- 分组名称
  description TEXT,                        -- 分组描述
  created_by TEXT NOT NULL,                -- 创建者ID
  created_at TEXT NOT NULL,                -- 创建时间
  updated_at TEXT NOT NULL                 -- 更新时间
);
```

### 用户会话表 (user_sessions)
```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,                     -- 会话ID
  uid TEXT NOT NULL,                       -- 用户ID
  token TEXT UNIQUE NOT NULL,              -- JWT Token
  expires_at TEXT NOT NULL,                -- 过期时间
  created_at TEXT NOT NULL                 -- 创建时间
);
```

## API接口

### 认证相关

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com"
}
```

#### 用户登出
```
POST /api/auth/logout
```

#### 获取当前用户信息
```
GET /api/auth/me
```

### 用户管理

#### 获取用户列表 (管理员)
```
GET /api/users
```

#### 创建用户 (管理员)
```
POST /api/users
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "role": "user",
  "group": "default"
}
```

#### 获取单个用户信息
```
GET /api/users/{uid}
```

#### 更新用户信息
```
PUT /api/users/{uid}
Content-Type: application/json

{
  "username": "updateduser",
  "email": "newemail@example.com",
  "role": "admin",
  "group": "newgroup"
}
```

#### 删除用户 (管理员)
```
DELETE /api/users/{uid}
```

### 分组管理

#### 获取分组列表 (管理员)
```
GET /api/groups
```

#### 创建分组 (管理员)
```
POST /api/groups
Content-Type: application/json

{
  "name": "新分组",
  "description": "分组描述"
}
```

#### 获取单个分组信息 (管理员)
```
GET /api/groups/{id}
```

#### 更新分组信息 (管理员)
```
PUT /api/groups/{id}
Content-Type: application/json

{
  "name": "更新后的分组名",
  "description": "更新后的描述"
}
```

#### 删除分组 (管理员)
```
DELETE /api/groups/{id}
```

## 部署说明

### Docker部署

1. **创建数据目录**
```bash
# 在Ubuntu服务器上创建数据目录
sudo mkdir -p /home/ubuntu/data /home/ubuntu/logs
sudo chown -R 1000:1000 /home/ubuntu/data /home/ubuntu/logs
```

2. **启动服务**
```bash
docker compose -f docker-compose.simple.yml up -d --build
```

3. **初始化数据库**
```bash
# 访问初始化接口
curl -X POST http://localhost:3000/api/init
```

### 本地开发

1. **安装依赖**
```bash
npm install
```

2. **创建数据目录**
```bash
mkdir -p data logs
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **初始化数据库**
```bash
curl -X POST http://localhost:3000/api/init
```

## 默认账户

系统会自动创建默认超级管理员账户：
- **用户名**: admin
- **密码**: admin123
- **角色**: super_admin
- **分组**: default

## 页面访问

### 认证页面
- **登录/注册**: `/auth`

### 管理页面 (需要管理员权限)
- **用户管理**: `/admin/users`
- **分组管理**: `/admin/groups` (待实现)

## 权限控制

### 前端权限控制
```typescript
// 检查用户是否有指定权限
const hasPermission = (userRole: string, requiredRole: string) => {
  const roleHierarchy = {
    'super_admin': 3,
    'admin': 2,
    'user': 1
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
```

### 后端权限控制
```typescript
// 使用中间件进行权限验证
import { withPermission } from '@/app/utils/middleware';

export const GET = withPermission('admin')(async (request) => {
  // 只有管理员可以访问的接口
});
```

## 安全注意事项

1. **生产环境配置**
   - 修改 `JWT_SECRET` 环境变量
   - 使用强密码策略
   - 启用HTTPS

2. **数据库安全**
   - 定期备份数据库
   - 限制数据库访问权限
   - 监控异常登录

3. **会话管理**
   - 定期清理过期会话
   - 支持多设备登录控制
   - 实现登录日志记录

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据目录权限
   - 确认数据库文件路径正确

2. **用户无法登录**
   - 检查用户名密码是否正确
   - 确认数据库已正确初始化

3. **权限不足**
   - 检查用户角色设置
   - 确认API接口权限要求

4. **Windows环境编译问题**
   - 如果遇到 `better-sqlite3` 编译错误，系统已自动使用 `sqlite3` 替代
   - 确保安装了 `@types/sqlite3` 类型定义
   - 如果仍有问题，可以尝试使用 Docker 开发环境

### 日志查看
```bash
# Docker环境
docker compose -f docker-compose.simple.yml logs -f

# 本地环境
# 查看控制台输出
```

## 扩展功能

### 计划中的功能
1. 分组管理页面
2. 用户头像上传
3. 密码重置功能
4. 登录日志记录
5. 用户活动统计

### 自定义扩展
可以根据需要扩展以下功能：
- 用户权限细分
- 多因素认证
- 第三方登录
- 用户行为分析
