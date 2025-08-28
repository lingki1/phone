# 黑市删除功能实现

## 功能概述

实现了黑市中角色卡和世界书的删除功能，支持以下权限控制：

- **作者权限**：用户可以删除自己上传的内容
- **管理员权限**：管理员和超级管理员可以删除任意内容

## 实现的功能

### 1. 后端API (`/api/blackmarket/items/[id]`)

- **DELETE方法**：删除指定的黑市物品
- **权限验证**：检查用户是否有删除权限
- **文件清理**：删除实际文件和数据记录
- **错误处理**：完善的错误处理和响应

### 2. 存储层 (`src/lib/blackmarket/storage.ts`)

- **deleteItem函数**：删除物品记录和实际文件
- **文件系统清理**：自动删除上传的文件
- **数据一致性**：确保JSON记录和文件同步删除

### 3. 前端服务 (`src/app/components/blackmarket/blackMarketService.ts`)

- **deleteItem方法**：调用删除API
- **错误处理**：处理网络错误和服务器错误
- **用户反馈**：返回操作结果和消息

### 4. 用户界面

#### 主界面 (`BlackMarket.tsx`)
- **删除按钮**：在物品卡片上显示删除按钮
- **权限显示**：根据用户权限显示不同的提示
- **确认对话框**：删除前显示确认信息
- **实时更新**：删除后自动刷新列表

#### 详情弹窗 (`ItemDetailModal.tsx`)
- **删除按钮**：在详情页面也提供删除功能
- **权限检查**：动态显示删除按钮

### 5. 样式设计 (`BlackMarket.css`)

- **删除按钮样式**：红色主题，突出危险操作
- **悬停效果**：提供视觉反馈
- **响应式设计**：适配不同屏幕尺寸

## 权限控制逻辑

```typescript
// 权限检查
const isAuthor = item.author === currentUser.username;
const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

if (!isAuthor && !isAdmin) {
  // 无权限删除
  return NextResponse.json({ error: 'Forbidden: You can only delete your own content' }, { status: 403 });
}
```

## 用户体验

### 删除确认
- **作者删除**：显示"您确定要删除 [名称] 吗？此操作不可撤销！"
- **管理员删除**：显示"您确定要删除 [名称] 吗？作者：[作者名]"

### 操作反馈
- **成功**：显示"删除成功"并自动刷新列表
- **失败**：显示具体错误信息
- **权限不足**：显示"您没有权限删除此内容"

## 技术特点

1. **类型安全**：完整的TypeScript类型定义
2. **错误处理**：完善的错误捕获和处理机制
3. **用户体验**：友好的用户界面和操作反馈
4. **安全性**：严格的权限控制和输入验证
5. **性能优化**：异步操作和状态管理

## 文件结构

```
src/
├── app/
│   ├── api/blackmarket/items/[id]/route.ts  # 删除API
│   └── components/blackmarket/
│       ├── BlackMarket.tsx                  # 主界面
│       ├── ItemDetailModal.tsx              # 详情弹窗
│       ├── blackMarketService.ts            # 服务层
│       └── BlackMarket.css                  # 样式文件
└── lib/blackmarket/
    └── storage.ts                           # 存储层
```

## 测试建议

1. **权限测试**：测试不同角色用户的删除权限
2. **文件清理**：验证删除后文件是否被正确清理
3. **UI测试**：测试删除按钮的显示和交互
4. **错误处理**：测试各种错误情况下的处理
5. **并发测试**：测试同时删除多个项目的稳定性
