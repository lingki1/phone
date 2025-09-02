# 额外信息功能与世界书系统集成

## 概述

额外信息功能现在使用世界书系统来存储用户配置，无需扩展IndexedDB数据库。这种方式可以复用现有的数据管理机制，并提供更好的数据组织和管理能力。

## 集成方式

### 1. 世界书分类

- **分类名称**: `extrainfo`
- **用途**: 专门存储额外信息功能的配置

### 2. 世界书命名规则

- **格式**: `{角色名字} 的额外信息`
- **示例**: `小明的额外信息`、`AI助手的额外信息`

### 3. 世界书内容结构

```json
{
  "id": "extrainfo_{chatId}_{timestamp}",
  "name": "{角色名字} 的额外信息",
  "content": "用户的功能描述内容",
  "category": "extrainfo",
  "description": "额外信息功能配置 - {角色名字}",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

## 工作流程

### 1. 启用功能时

1. 用户在额外信息设置页面启用功能
2. 系统自动创建新的世界书条目
3. 世界书分类设置为 `extrainfo`
4. 世界书名称设置为 `{角色名字} 的额外信息`
5. 世界书内容设置为用户的功能描述

### 2. 更新配置时

1. 用户修改功能描述
2. 系统更新对应世界书的内容
3. 更新世界书的 `updatedAt` 时间戳

### 3. 禁用功能时

1. 用户在设置页面禁用功能
2. 系统自动删除对应的世界书条目
3. 清理相关配置数据

## 优势

### 1. 数据管理

- **统一存储**: 所有额外信息配置集中管理
- **分类清晰**: 通过 `extrainfo` 分类快速识别
- **易于备份**: 世界书系统提供完整的数据备份功能

### 2. 用户体验

- **透明操作**: 用户无需了解底层存储细节
- **自动管理**: 系统自动处理世界书的创建和删除
- **一致性**: 与世界书系统的其他功能保持一致

### 3. 开发维护

- **代码复用**: 无需实现新的数据存储逻辑
- **维护简单**: 利用现有的世界书管理功能
- **扩展性**: 可以轻松添加更多配置选项

## 技术实现

### 1. 数据加载

```typescript
// 从世界书加载配置
const worldBooks = await dataManager.getWorldBooks();
const extraInfoWorldBook = worldBooks.find(wb => 
  wb.category === 'extrainfo' && 
  wb.name === `${chatName} 的额外信息`
);
```

### 2. 数据保存

```typescript
// 保存到世界书
const worldBook: WorldBook = {
  id: `extrainfo_${chatId}_${Date.now()}`,
  name: `${chatName} 的额外信息`,
  content: description,
  category: 'extrainfo',
  description: `额外信息功能配置 - ${chatName}`,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

await dataManager.saveWorldBook(worldBook);
```

### 3. 数据删除

```typescript
// 删除世界书
const extraInfoWorldBook = worldBooks.find(wb => 
  wb.category === 'extrainfo' && 
  wb.name === `${chatName} 的额外信息`
);

if (extraInfoWorldBook) {
  await dataManager.deleteWorldBook(extraInfoWorldBook.id);
}
```

## 注意事项

### 1. 数据一致性

- 确保世界书名称的唯一性
- 处理并发更新时的数据冲突
- 保持配置状态与世界书状态的同步

### 2. 错误处理

- 世界书操作失败时的回退机制
- 数据损坏时的恢复策略
- 用户友好的错误提示

### 3. 性能优化

- 避免频繁的世界书查询
- 合理使用缓存机制
- 优化数据加载时机

## 未来扩展

### 1. 配置版本管理

- 支持配置的历史版本
- 提供配置回滚功能
- 配置变更的审计日志

### 2. 模板系统

- 预定义的额外信息模板
- 用户自定义模板保存
- 模板的导入导出功能

### 3. 多角色支持

- 支持同一角色的多个配置
- 配置的继承和覆盖机制
- 角色间的配置共享
