# 用户认证系统

## 文件结构

```
src/app/auth/
├── README.md              # 本文档
├── index.ts               # 模块导出文件
├── auth.css               # 认证页面样式
├── utils/                 # 工具类
│   ├── auth.ts           # 认证服务
│   └── database.ts       # 数据库管理
└── components/           # 组件 (位于 src/app/components/auth/)
    ├── AuthModal.tsx     # 认证模态窗口
    ├── LoginForm.tsx     # 登录表单
    └── RegisterForm.tsx  # 注册表单
```

## 功能特性

### 🔐 用户认证
- 用户注册和登录
- JWT Token 认证
- 会话管理
- 密码加密存储

### 👥 用户管理
- 用户角色系统 (super_admin, admin, user)
- 用户分组管理
- 用户信息管理

### 🛡️ 安全特性
- 密码哈希加密
- Token 过期机制
- 权限验证中间件
- 会话清理

## API 接口

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `GET /api/users/[uid]` - 获取单个用户
- `PUT /api/users/[uid]` - 更新用户
- `DELETE /api/users/[uid]` - 删除用户

### 分组管理
- `GET /api/groups` - 获取分组列表
- `POST /api/groups` - 创建分组
- `GET /api/groups/[id]` - 获取单个分组
- `PUT /api/groups/[id]` - 更新分组
- `DELETE /api/groups/[id]` - 删除分组

## 使用方法

### 导入认证服务
```typescript
import { authService, databaseManager } from '@/app/auth';
```

### 使用认证组件
```typescript
import { AuthModal, LoginForm, RegisterForm } from '@/app/auth';
```

### 使用中间件
```typescript
import { withAuth, withPermission } from '@/app/utils/middleware';
```

## 数据库

### 用户表 (users)
- `uid` - 用户唯一标识
- `username` - 用户名
- `password` - 加密密码
- `role` - 用户角色
- `group_id` - 分组ID
- `created_at` - 创建时间
- `updated_at` - 更新时间
- `last_login` - 最后登录时间
- `avatar` - 头像
- `email` - 邮箱

### 用户分组表 (user_groups)
- `id` - 分组唯一标识
- `name` - 分组名称
- `description` - 分组描述
- `created_by` - 创建者
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 用户会话表 (user_sessions)
- `id` - 会话唯一标识
- `uid` - 用户ID
- `token` - JWT Token
- `expires_at` - 过期时间
- `created_at` - 创建时间

## 部署说明

### 本地开发
数据库文件存储在 `./data/phone.db`

### Docker 部署
数据库文件存储在 `/app/data/phone.db`

### 环境变量
- `JWT_SECRET` - JWT 密钥 (生产环境必须设置)
- `NODE_ENV` - 环境变量 (development/production)

## 默认账户

系统会自动创建超级管理员账户：
- 用户名: `lingki`
- 密码: `11111111`
- 角色: `super_admin`

## 注意事项

1. 生产环境必须设置 `JWT_SECRET` 环境变量
2. 定期清理过期会话
3. 数据库文件需要备份
4. 密码长度至少6个字符
5. 用户名长度3-20个字符
