# 世界书系统开发文档

## 概述

世界书系统是一个为AI聊天应用设计的背景设定管理功能。它允许用户创建、编辑和管理多个世界书，并将这些世界书关联到不同的AI角色和群聊中。当用户与AI聊天时，系统会自动将关联的世界书内容注入到系统提示词中，为AI提供丰富的背景信息。

## 系统架构

### 核心组件

1. **WorldBookListPage** - 世界书管理主页面
2. **WorldBookEditor** - 世界书编辑器
3. **WorldBookCard** - 世界书卡片组件
4. **WorldBookAssociationModal** - 世界书关联弹窗
5. **WorldBookInjector** - 世界书注入工具类

### 数据流

```
用户创建世界书 → 保存到IndexedDB → 关联到聊天 → AI聊天时注入到系统提示词
```

## 文件结构

```
src/app/components/qq/worldbook/
├── WorldBookListPage.tsx          # 世界书管理页面
├── WorldBookListPage.css          # 世界书管理页面样式
├── WorldBookEditor.tsx            # 世界书编辑器
├── WorldBookEditor.css            # 世界书编辑器样式
├── WorldBookAssociationModal.tsx  # 世界书关联弹窗
├── WorldBookAssociationModal.css  # 世界书关联弹窗样式
├── WorldBookCard.tsx              # 世界书卡片组件
├── WorldBookCard.css              # 世界书卡片样式
├── __tests__/                     # 测试文件
│   ├── WorldBookCard.test.tsx
│   └── WorldBookEditor.test.tsx
└── index.ts                       # 导出文件

src/app/utils/
├── WorldBookInjector.ts           # 世界书注入工具类
└── __tests__/
    └── WorldBookInjector.test.ts  # 注入器测试
```

## 数据模型

### WorldBook 接口

```typescript
export interface WorldBook {
  id: string;           // 唯一标识符
  name: string;         // 世界书名称
  content: string;      // 世界书内容
  createdAt: number;    // 创建时间戳
  updatedAt: number;    // 更新时间戳
  description?: string; // 可选描述
}
```

### 数据库存储

世界书数据存储在IndexedDB的`worldBooks`对象存储中，包含以下索引：
- `name` - 按名称索引
- `createdAt` - 按创建时间索引

## API 参考

### DataManager 扩展方法

```typescript
// 保存世界书
async saveWorldBook(worldBook: WorldBook): Promise<void>

// 获取所有世界书
async getAllWorldBooks(): Promise<WorldBook[]>

// 获取单个世界书
async getWorldBook(id: string): Promise<WorldBook | null>

// 删除世界书
async deleteWorldBook(id: string): Promise<void>

// 更新世界书
async updateWorldBook(worldBook: WorldBook): Promise<void>
```

### WorldBookInjector 方法

```typescript
// 注入世界书内容到系统提示词
static async injectWorldBooks(
  chatId: string,
  originalPrompt: string,
  linkedWorldBookIds: string[]
): Promise<string>

// 验证世界书ID是否存在
static async validateWorldBookIds(worldBookIds: string[]): Promise<string[]>

// 清理无效的世界书关联
static async cleanupInvalidWorldBooks(
  chatId: string,
  linkedWorldBookIds: string[]
): Promise<string[]>
```

## 主题系统集成

所有世界书组件都使用CSS变量来支持主题切换：

```css
/* 主要颜色变量 */
--theme-bg-primary      /* 主要背景色 */
--theme-bg-secondary    /* 次要背景色 */
--theme-bg-tertiary     /* 第三级背景色 */
--theme-text-primary    /* 主要文字颜色 */
--theme-text-secondary  /* 次要文字颜色 */
--theme-text-tertiary   /* 第三级文字颜色 */
--theme-border-color    /* 边框颜色 */
--theme-accent-color    /* 强调色 */
```

## 错误处理

### 数据操作错误

1. **世界书保存失败** - 显示错误提示，允许用户重试
2. **世界书加载失败** - 显示加载错误状态，提供刷新选项
3. **世界书删除失败** - 显示错误提示，保持原有状态

### 注入错误处理

1. **世界书内容获取失败** - 跳过该世界书，继续处理其他世界书
2. **注入过程异常** - 使用原始系统提示词，记录错误日志

## 性能优化

### 数据缓存

- 在内存中缓存常用的世界书内容
- 使用懒加载策略，只在需要时加载世界书内容

### UI优化

- 使用虚拟滚动处理大量世界书列表
- 实现防抖搜索功能
- 优化长文本的显示和编辑性能

## 测试策略

### 单元测试

- **WorldBookInjector类测试** - 测试世界书内容注入逻辑
- **组件渲染测试** - 测试各个组件的正确渲染

### 集成测试

- **世界书管理流程测试** - 测试创建、编辑、删除世界书的完整流程
- **世界书关联测试** - 测试世界书与聊天的关联和取消关联

## 扩展指南

### 添加新功能

1. 在相应的组件中添加UI元素
2. 在dataManager中添加必要的数据操作方法
3. 更新WorldBook接口（如需要）
4. 添加相应的测试用例

### 添加新主题

确保新主题定义了所有必要的CSS变量，世界书组件会自动适配。

## 故障排除

### 常见问题

1. **世界书不显示** - 检查数据库连接和数据加载逻辑
2. **主题不生效** - 确认CSS变量定义正确
3. **注入失败** - 检查WorldBookInjector的错误日志
4. **性能问题** - 检查是否有大量世界书或长文本内容

### 调试技巧

1. 使用浏览器开发者工具查看IndexedDB数据
2. 检查控制台错误日志
3. 使用React DevTools检查组件状态
4. 验证CSS变量是否正确应用

## 最佳实践

### 世界书内容编写

1. **保持简洁** - 避免过长的描述，重点突出关键信息
2. **结构化** - 使用标题和段落组织内容
3. **相关性** - 确保内容与聊天场景相关
4. **一致性** - 保持多个世界书之间的设定一致

### 性能考虑

1. **限制数量** - 避免关联过多世界书到单个聊天
2. **内容长度** - 控制单个世界书的内容长度
3. **定期清理** - 删除不再使用的世界书

### 用户体验

1. **清晰命名** - 使用描述性的世界书名称
2. **添加描述** - 为世界书添加简短描述说明用途
3. **分类管理** - 按主题或用途组织世界书