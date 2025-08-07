# 提示词注入系统

这是一个模块化的、可扩展的提示词注入系统，用于管理聊天应用中的AI提示词构建。

## 系统架构

```
src/app/components/systemprompt/
├── index.ts                    # 主入口文件
├── types.ts                    # 类型定义
├── core/
│   └── PromptManager.ts        # 提示词管理器
├── injectors/
│   ├── WorldBookInjector.ts    # 世界书注入器
│   ├── MemoryInjector.ts       # 记忆注入器
│   ├── StatusInjector.ts       # 状态注入器
│   └── PresetInjector.ts       # 预设注入器
├── templates/
│   ├── BaseTemplate.ts         # 基础模板
│   ├── GroupChatTemplate.ts    # 群聊模板
│   └── SingleChatTemplate.ts   # 单聊模板
└── utils/
    └── PromptFormatter.ts      # 提示词格式化工具
```

## 核心概念

### 1. 提示词管理器 (PromptManager)
- 统一管理所有提示词注入器
- 按优先级执行注入器
- 构建完整的系统提示词
- 提供API参数和消息载荷

### 2. 注入器 (Injector)
- 实现 `PromptInjector` 接口
- 每个注入器负责特定的功能
- 按优先级顺序执行
- 支持异步操作

### 3. 模板 (Template)
- 继承自 `BaseTemplate`
- 提供基础提示词结构
- 支持群聊和单聊两种模式

## 注入器说明

### WorldBookInjector (优先级: 10)
- 注入世界书内容
- 从数据库获取世界书数据
- 格式化为 "## 世界书名\n世界书内容"

### MemoryInjector (优先级: 20)
- 注入记忆信息
- 群聊中注入单聊记忆
- 单聊中注入群聊记忆

### StatusInjector (优先级: 30)
- 注入聊天状态信息
- 仅在单聊中生效
- 支持状态更新要求

### PresetInjector (优先级: 5)
- 注入预设配置
- 影响API调用参数
- 提供创造性设置说明

## 使用方法

### 基本使用

```typescript
import { getPromptManager, PromptContext } from '../systemprompt';

// 构建提示词上下文
const context: PromptContext = {
  chat,
  currentTime,
  myNickname,
  myPersona,
  allChats,
  availableContacts,
  chatStatus,
  currentPreset,
  dbPersonalSettings,
  personalSettings
};

// 获取提示词管理器
const promptManager = getPromptManager();

// 构建完整提示词
const result = await promptManager.buildPrompt(context);

// 使用结果
const { systemPrompt, messagesPayload, apiParams } = result;
```

### 添加自定义注入器

```typescript
import { PromptInjector, PromptContext } from '../systemprompt';

class CustomInjector implements PromptInjector {
  priority = 15; // 设置优先级

  async inject(context: PromptContext): Promise<string> {
    // 实现注入逻辑
    return '自定义内容';
  }
}

// 添加到管理器
const promptManager = getPromptManager();
promptManager.addInjector(new CustomInjector());
```

### 验证提示词

```typescript
import { validateSystemPrompt } from '../systemprompt';

const validation = validateSystemPrompt(systemPrompt);
if (!validation.isValid) {
  console.error('提示词验证失败:', validation.errors);
}
```

## 配置选项

### 注入器优先级
- 数字越小优先级越高
- 建议范围: 1-100
- 默认优先级:
  - PresetInjector: 5
  - WorldBookInjector: 10
  - MemoryInjector: 20
  - StatusInjector: 30

### 全局设置
- `maxMemory`: 最大记忆数量 (默认: 20)
- `enableBackgroundActivity`: 后台活动开关
- `backgroundActivityInterval`: 后台活动间隔

## 扩展指南

### 创建新的注入器

1. 实现 `PromptInjector` 接口
2. 设置合适的优先级
3. 实现 `inject` 方法
4. 添加到 `PromptManager`

### 创建新的模板

1. 继承 `BaseTemplate`
2. 实现 `build` 方法
3. 在 `PromptManager` 中注册

### 自定义格式化

使用 `PromptFormatter` 类进行提示词格式化：

```typescript
import { PromptFormatter } from '../systemprompt/utils/PromptFormatter';

// 格式化提示词
const formatted = PromptFormatter.formatPrompt(systemPrompt);

// 分析提示词
const analysis = PromptFormatter.analyzePrompt(systemPrompt);

// 提取关键信息
const keyInfo = PromptFormatter.extractKeyInfo(systemPrompt);
```

## 调试和监控

### 日志输出
系统会输出详细的调试信息：
- 注入器执行状态
- 提示词构建过程
- 错误和警告信息

### 性能监控
- 提示词长度统计
- 注入器执行时间
- 内存使用情况

## 最佳实践

1. **优先级设置**: 根据依赖关系设置合理的优先级
2. **错误处理**: 注入器应该优雅处理错误，不影响其他注入器
3. **性能优化**: 避免在注入器中进行耗时操作
4. **类型安全**: 使用TypeScript确保类型安全
5. **测试覆盖**: 为每个注入器编写单元测试

## 故障排除

### 常见问题

1. **注入器不执行**: 检查优先级设置
2. **提示词格式错误**: 使用 `PromptFormatter.validateFormat`
3. **性能问题**: 检查注入器是否有耗时操作
4. **类型错误**: 确保 `PromptContext` 包含所有必需字段

### 调试技巧

1. 使用 `promptManager.getInjectors()` 查看注入器列表
2. 检查控制台日志了解执行过程
3. 使用 `PromptFormatter.analyzePrompt` 分析提示词结构
4. 逐步禁用注入器定位问题

## 更新日志

### v1.0.0
- 初始版本
- 支持基础提示词注入
- 包含世界书、记忆、状态、预设注入器
- 提供群聊和单聊模板
- 完整的类型定义和工具函数
