# 斗图功能实现计划

## 功能概述

斗图功能是一个**工具函数管理系统**，允许用户：
1. 管理自己的图片工具函数（函数名 + 图片URL + 描述）
2. 在聊天中发送图片（前端渲染图片URL，AI接收函数调用）
3. AI能够调用用户的工具函数发送图片给用户
4. 形成完整的图片交互闭环

## 核心原理

- **用户端**：点击斗图 → 选择工具函数 → 前端渲染图片URL → 发送函数调用给AI
- **AI端**：接收函数调用 → 通过系统注入词调用用户工具函数 → 发送图片消息
- **存储**：所有工具函数存储在IndexedDB中，通过系统提示词注入给AI

## 技术架构

### 1. 数据层 (dataManager.ts)
- 添加FakePicTool相关的存储方法
- 支持工具函数的CRUD操作
- 支持函数分类和搜索

### 2. 组件层 (fakepic/)
- FakePicManager：工具函数管理主界面
- FakePicSelector：工具函数选择器
- FakePicMessage：图片消息显示组件
- FakePicModal：工具函数管理模态框

### 3. 系统提示词层 (systemprompt/)
- FakePicInjector：工具函数库注入器
- 将用户工具函数注入AI上下文
- 定义AI调用工具函数的格式

### 4. 界面集成层
- 在ChatInterface中添加斗图按钮
- 集成工具函数管理功能
- 支持工具函数消息的发送和显示

## 实现步骤

### 第一阶段：数据层实现
1. **扩展dataManager.ts**
   - 添加FakePicToolStore存储
   - 实现工具函数CRUD方法
   - 添加函数分类和搜索功能

2. **定义数据类型**
   - 在types.ts中添加FakePicTool相关类型
   - 定义工具函数消息类型

### 第二阶段：组件开发
1. **创建fakepic/目录结构**
   - FakePicManager.tsx：工具函数管理主组件
   - FakePicSelector.tsx：工具函数选择器
   - FakePicMessage.tsx：图片消息组件
   - FakePicModal.tsx：模态框组件
   - index.ts：导出文件

2. **实现核心功能**
   - 工具函数添加/编辑/删除
   - 函数分类管理
   - 函数搜索功能
   - 图片预览功能

### 第三阶段：系统提示词集成
1. **创建FakePicInjector**
   - 实现PromptInjector接口
   - 注入用户工具函数到AI上下文
   - 定义AI调用格式

2. **注册注入器**
   - 在PromptManager中注册FakePicInjector
   - 设置合适的优先级

### 第四阶段：界面集成
1. **修改ChatInterface.tsx**
   - 添加斗图按钮
   - 集成工具函数管理模态框
   - 支持工具函数消息发送

2. **消息处理**
   - 支持fake_pic_tool消息类型
   - 实现图片消息渲染
   - 处理AI发送的图片消息

### 第五阶段：测试和优化
1. **功能测试**
   - 工具函数管理功能测试
   - AI调用工具函数测试
   - 消息发送接收测试

2. **性能优化**
   - 图片加载优化
   - 搜索性能优化
   - 内存使用优化

## 文件结构

```
src/app/components/
├── fakepic/
│   ├── index.ts                    # 导出文件
│   ├── FakePicManager.tsx          # 工具函数管理主组件
│   ├── FakePicSelector.tsx         # 工具函数选择器
│   ├── FakePicMessage.tsx          # 图片消息组件
│   ├── FakePicModal.tsx            # 模态框组件
│   ├── FakePicForm.tsx             # 工具函数添加/编辑表单
│   ├── FakePicList.tsx             # 工具函数列表组件
│   ├── FakePicSearch.tsx           # 工具函数搜索组件
│   └── FakePic.css                 # 样式文件
└── systemprompt/
    └── injectors/
        └── FakePicInjector.ts      # 工具函数库注入器
```

## 数据模型

### FakePicTool类型定义
```typescript
interface FakePicTool {
  id: string;
  functionName: string;        // 函数名，如 "send_happy_emoji"
  functionDescription: string; // 函数描述，如 "发送开心的表情"
  imageUrl: string;           // 图片URL
  category: string;           // 分类，如 "表情包"
  tags: string[];            // 标签数组
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  isFavorite: boolean;
  parameters?: {              // 可选参数定义
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
}
```

### 工具函数消息类型
```typescript
interface FakePicToolMessage extends Message {
  type: 'fake_pic_tool';
  functionName: string;       // 调用的函数名
  functionDescription: string; // 函数描述
  imageUrl: string;          // 图片URL
  parameters?: Record<string, any>; // 函数参数
}
```

## 接口定义

### dataManager方法
```typescript
// 保存工具函数
async saveFakePicTool(tool: FakePicTool): Promise<void>

// 获取所有工具函数
async getAllFakePicTools(): Promise<FakePicTool[]>

// 根据分类获取工具函数
async getFakePicToolsByCategory(category: string): Promise<FakePicTool[]>

// 搜索工具函数
async searchFakePicTools(query: string): Promise<FakePicTool[]>

// 根据函数名获取工具函数
async getFakePicToolByName(functionName: string): Promise<FakePicTool | null>

// 删除工具函数
async deleteFakePicTool(id: string): Promise<void>

// 更新工具函数使用次数
async incrementFakePicToolUsage(id: string): Promise<void>
```

### AI调用格式
```typescript
// AI调用用户工具函数的格式
{
  type: 'fake_pic_tool',
  functionName: string,       // 要调用的函数名
  parameters?: Record<string, any>  // 可选的函数参数
}
```

## 系统提示词注入格式

```markdown
# 图片工具函数库
你拥有以下图片工具函数，可以通过函数名调用：

## 表情包函数
- `send_happy_emoji()` - 发送开心的表情 😊
- `send_sad_emoji()` - 发送伤心的表情 😢
- `send_angry_emoji()` - 发送生气的表情 😠
- `send_love_emoji()` - 发送爱心表情 ❤️

## 场景图函数
- `show_office_scene()` - 显示办公室场景 🏢
- `show_cafe_scene()` - 显示咖啡厅场景 ☕
- `show_park_scene()` - 显示公园场景 🌳

## 自定义函数
- `send_custom_pic(description: string)` - 发送自定义图片，根据描述匹配

## 使用说明
1. 当需要发送图片时，直接调用对应的函数名
2. 函数调用格式：`functionName(parameters)`
3. 可以配合文字消息一起发送
4. 函数会自动渲染对应的图片
```

## 工具函数示例

### 基础表情函数
```typescript
// 用户定义的工具函数
{
  id: "tool_001",
  functionName: "send_happy_emoji",
  functionDescription: "发送开心的表情",
  imageUrl: "https://example.com/happy.png",
  category: "表情包",
  tags: ["开心", "表情", "emoji"],
  usageCount: 0,
  isFavorite: false
}
```

### 带参数的自定义函数
```typescript
{
  id: "tool_002",
  functionName: "send_custom_pic",
  functionDescription: "发送自定义图片",
  imageUrl: "https://example.com/custom.png",
  category: "自定义",
  tags: ["自定义", "图片"],
  parameters: [
    {
      name: "description",
      type: "string",
      description: "图片描述",
      required: true
    }
  ],
  usageCount: 0,
  isFavorite: false
}
```

## 消息处理流程

### 用户发送图片
1. 用户点击斗图按钮
2. 选择要发送的工具函数
3. 前端渲染图片URL显示
4. 发送函数调用消息给AI：
```typescript
{
  type: 'fake_pic_tool',
  functionName: 'send_happy_emoji',
  functionDescription: '发送开心的表情',
  imageUrl: 'https://example.com/happy.png',
  role: 'user',
  timestamp: Date.now()
}
```

### AI调用图片
1. AI通过系统注入词了解可用的工具函数
2. AI发送函数调用消息：
```typescript
{
  type: 'fake_pic_tool',
  functionName: 'send_happy_emoji',
  functionDescription: '发送开心的表情',
  imageUrl: 'https://example.com/happy.png',
  role: 'assistant',
  timestamp: Date.now()
}
```

## 测试计划

### 功能测试
1. **工具函数管理测试**
   - 添加工具函数功能
   - 编辑工具函数信息
   - 删除工具函数功能
   - 函数分类管理

2. **搜索功能测试**
   - 按函数名搜索
   - 按分类搜索
   - 按标签搜索

3. **消息发送测试**
   - 用户发送工具函数消息
   - AI接收函数调用
   - 前端正确渲染图片

4. **AI调用测试**
   - AI通过函数名调用图片
   - 函数匹配准确性
   - 消息格式正确性

### 性能测试
1. **图片加载性能**
   - 大量工具函数的加载速度
   - 图片缓存机制

2. **搜索性能**
   - 大量工具函数的搜索速度
   - 搜索结果的准确性

3. **内存使用**
   - 工具函数数据的内存占用
   - 长时间使用的内存泄漏

## 注意事项

1. **函数名唯一性**：确保工具函数名在用户库中唯一
2. **图片URL验证**：确保添加的图片URL是有效的
3. **函数描述准确性**：函数描述要准确，便于AI理解
4. **性能优化**：大量工具函数时的加载和搜索性能
5. **用户体验**：界面要简洁易用，操作流畅
6. **数据安全**：工具函数数据的备份和恢复机制

## 后续扩展

1. **函数分类系统**：支持自定义分类
2. **函数标签系统**：支持多标签管理
3. **函数收藏功能**：支持收藏常用函数
4. **函数使用统计**：统计函数使用频率
5. **函数导入导出**：支持批量导入导出
6. **函数分享功能**：支持工具函数库分享
7. **参数化函数**：支持带参数的工具函数
8. **函数组合**：支持多个函数组合调用
