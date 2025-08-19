# 剧情模式分离更新

## 更新内容

### 1. Switch Toggle 显示优化
- ✅ 剧情模式下switch toggle显示"聊天"文案
- ✅ 保持图标和切换逻辑不变

### 2. 红包按钮隐藏
- ✅ 剧情模式下隐藏红包按钮
- ✅ 普通聊天模式下正常显示红包按钮
- ✅ 使用条件渲染 `{!isStoryMode && (...)}`

### 3. 聊天内容分离
- ✅ 剧情模式使用独立的消息列表 `storyModeMessages`
- ✅ 普通聊天模式使用原有的 `chat.messages`
- ✅ 切换模式时自动清空剧情模式消息
- ✅ AI回复根据模式分别处理

## 技术实现

### 状态管理
```tsx
// 剧情模式相关状态
const [isStoryMode, setIsStoryMode] = useState(false);
const [storyModeInput, setStoryModeInput] = useState('');
const [storyModeMessages, setStoryModeMessages] = useState<Message[]>([]);
```

### 条件渲染红包按钮
```tsx
<div className="action-buttons-left">
  {!isStoryMode && (
    <button className="action-btn red-packet-btn">
      <span className="btn-icon">🧧</span>
      <span className="btn-text">红包</span>
    </button>
  )}
</div>
```

### 消息显示分离
```tsx
{isStoryMode ? (
  <StoryModeDisplay
    messages={storyModeMessages} // 使用剧情模式消息
    // ... 其他属性
  />
) : (
  // 普通聊天模式显示
  // 使用 chat.messages
)}
```

### AI回复处理分离
```tsx
// 剧情模式AI回复处理函数
const handleStoryModeAiResponse = useCallback(async (aiMessage: Message) => {
  setStoryModeMessages(prev => [...prev, aiMessage]);
  // 触发通知等
}, [chat]);

// 修改triggerAiResponse支持剧情模式
const triggerAiResponse = useCallback(async (updatedChat: ChatItem, isStoryModeCall: boolean = false) => {
  // 根据isStoryModeCall参数决定处理方式
  if (isStoryModeCall) {
    await handleStoryModeAiResponse(aiMessage);
  } else {
    // 原有的普通模式处理
    onUpdateChat(currentChat);
  }
}, []);
```

### 模式切换清理
```tsx
const handleStoryModeToggle = useCallback(() => {
  setIsStoryMode(prev => !prev);
  setStoryModeInput('');
  setMessage('');
  setStoryModeMessages([]); // 清空剧情模式消息
}, []);
```

## 用户体验改进

### 1. 界面清晰度
- 剧情模式下不显示红包按钮，界面更简洁
- Switch toggle文案明确指示当前模式和可切换到的模式

### 2. 内容隔离
- 剧情模式和聊天模式的消息完全分离
- 切换模式时不会混淆消息内容
- 每种模式都有独立的消息历史

### 3. 功能完整性
- 保持所有原有功能不变
- 剧情模式支持完整的AI对话功能
- 消息通知、编辑、删除等功能正常工作

## 代码优化

### 类型安全
- 更新了 `triggerAiResponseRef` 的类型定义
- 支持可选的 `isStoryModeCall` 参数
- 保持向后兼容性

### 状态管理
- 清晰的职责分离
- 避免状态混淆
- 易于维护和扩展

### 性能优化
- 条件渲染减少不必要的DOM元素
- 独立的消息列表避免不必要的重渲染
- 保持原有的性能优化特性

## 兼容性

- ✅ 完全兼容现有功能
- ✅ 保持原有的消息处理逻辑
- ✅ 支持所有现有的输入功能
- ✅ 响应式设计保持不变
- ✅ 向后兼容，不影响现有聊天记录

## 总结

这次更新成功实现了剧情模式的完全分离，包括界面元素、消息内容和AI回复处理。用户现在可以在两种模式之间清晰切换，享受独立的消息体验，同时保持每种模式的独特功能。
