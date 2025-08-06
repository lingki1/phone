# 异步AI状态管理组件

## 概述

这是一个商业级别的异步AI状态管理解决方案，用于管理聊天应用中AI回复的异步状态。

## 功能特性

- **全局状态管理**：使用React Context管理所有聊天窗口的AI异步状态
- **会话隔离**：每个聊天窗口的AI状态独立，互不影响
- **视觉反馈**：提供多种动画效果的AI状态指示器
- **输入控制**：AI回复期间自动禁用输入框和相关按钮
- **状态持久化**：使用localStorage持久化状态，页面刷新或重新进入后状态依然保持准确

## 组件结构

```
src/app/components/async/
├── AiPendingProvider.tsx      # Context Provider
├── AiPendingIndicator.tsx     # 状态指示器组件
├── useAiPendingState.ts       # 自定义Hook
├── AiPendingIndicator.css     # 指示器样式
├── index.ts                   # 统一导出
└── README.md                  # 使用说明
```

## 使用方法

### 1. 在根布局中添加Provider

```tsx
// src/app/layout.tsx
import { AiPendingProvider } from "./components/async";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AiPendingProvider>
          {children}
        </AiPendingProvider>
      </body>
    </html>
  );
}
```

### 2. 在聊天组件中使用

```tsx
import { useAiPendingState, AiPendingIndicator } from '../async';

export default function ChatInterface({ chat }) {
  // 使用异步AI状态管理
  const { isPending, startAiTask, endAiTask } = useAiPendingState(chat.id);

  // 发送消息时
  const handleSendMessage = async () => {
    // ... 创建用户消息
    startAiTask(); // 开始AI任务
    triggerAiResponse(updatedChat);
  };

  // AI回复结束时
  const triggerAiResponse = async (updatedChat) => {
    try {
      // ... AI逻辑
    } finally {
      endAiTask(); // 结束AI任务
    }
  };

  return (
    <div>
             {/* 头部指示器 */}
       <div className="chat-actions">
         <AiPendingIndicator 
           isPending={isPending}
           size="small"
           variant="dots"
           aiName={chat.name}
         />
         {/* 其他按钮 */}
       </div>

      {/* 输入区域 */}
      <textarea
        disabled={isLoading || isPending}
        placeholder={isPending ? "AI正在回复中，请稍候..." : "输入消息..."}
      />
      
      <button disabled={!message.trim() || isLoading || isPending}>
        发送
      </button>
    </div>
  );
}
```

## API 参考

### AiPendingProvider

Context Provider组件，需要在应用根组件中包裹。

### useAiPendingState(chatId: string)

返回指定聊天的AI状态管理方法：

- `isPending: boolean` - 当前是否有AI异步任务
- `startAiTask()` - 开始AI任务
- `endAiTask()` - 结束AI任务
- `clearPending()` - 清除AI状态
- `executeAiTask(task)` - 自动管理状态的AI任务执行器

### AiPendingIndicator

状态指示器组件：

```tsx
<AiPendingIndicator 
  isPending={boolean}
  size="small" | "medium" | "large"
  variant="dots" | "pulse" | "wave"
  className={string}
  aiName={string} // AI角色名字，用于显示"xxx正在输入中"
/>
```

## 动画效果

- **dots**: 三个点的打字动画（默认）
- **pulse**: 脉冲圆圈动画
- **wave**: 波浪条动画

## 商业级特性

1. **性能优化**：避免不必要的重渲染
2. **类型安全**：完整的TypeScript支持
3. **响应式设计**：适配各种屏幕尺寸
4. **主题支持**：支持深色/浅色主题
5. **状态持久化**：localStorage自动保存，页面刷新不丢失
6. **可扩展性**：易于添加新功能和动画
7. **团队协作**：清晰的代码结构和文档

## 最佳实践

1. 总是在AI任务开始时调用 `startAiTask()`
2. 在 `finally` 块中调用 `endAiTask()` 确保状态正确清理
3. 使用 `executeAiTask()` 可以自动管理状态
4. 根据业务需求选择合适的指示器样式
5. 在组件卸载时无需手动清理状态（Context会自动处理） 