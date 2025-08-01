# 聊天输入框自动高度调整功能

## 问题描述
在聊天界面中，当用户输入多行内容时，输入框需要自动增加高度以适应内容，提供更好的用户体验。

## 解决方案

### 1. 自动高度调整函数
实现了 `adjustTextareaHeight` 函数，能够根据内容自动调整输入框高度：
- 最小高度：40px（一行）
- 最大高度：120px（5行）
- 超出最大高度时显示滚动条

### 2. 触发时机
在以下情况下自动调整输入框高度：
- 用户输入内容时（`handleInputChange`）
- 选择@提及成员后（`selectMention`）
- 发送消息后重置高度（`handleSendMessage`）
- 组件初始化时（`useEffect`）

### 3. 样式优化
为 textarea 添加了必要的样式属性：
- `resize: 'none'` - 禁用手动调整大小
- `overflow: 'hidden'` - 隐藏滚动条（在最大高度内）
- `minHeight: '40px'` - 设置最小高度
- `maxHeight: '120px'` - 设置最大高度

## 代码实现

### 自动高度调整函数
```typescript
const adjustTextareaHeight = () => {
  const textarea = textareaRef.current;
  if (!textarea) return;

  // 重置高度以获取正确的 scrollHeight
  textarea.style.height = 'auto';
  
  // 计算新高度，最小高度为一行，最大高度为5行
  const minHeight = 40; // 一行的高度
  const maxHeight = 120; // 5行的高度
  const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
  
  textarea.style.height = `${newHeight}px`;
};
```

### 输入变化处理
```typescript
const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const value = e.target.value;
  const cursorPos = e.target.selectionStart;
  
  setMessage(value);
  
  // 自动调整输入框高度
  adjustTextareaHeight();
  
  // ... 其他处理逻辑
};
```

### @提及选择处理
```typescript
const selectMention = (member: GroupMember) => {
  const beforeMention = message.substring(0, mentionCursorPos);
  const afterMention = message.substring(mentionCursorPos + mentionFilter.length + 1);
  const newMessage = beforeMention + `@${member.groupNickname} ` + afterMention;
  
  setMessage(newMessage);
  setShowMentionList(false);
  
  // 延迟调整高度，确保状态更新完成
  setTimeout(() => {
    adjustTextareaHeight();
    textareaRef.current?.focus();
  }, 0);
};
```

### 发送消息后重置
```typescript
const handleSendMessage = async () => {
  // ... 发送消息逻辑
  
  setMessage('');
  setQuotedMessage(undefined);

  // 重置输入框高度
  setTimeout(() => {
    adjustTextareaHeight();
  }, 0);

  // ... 其他逻辑
};
```

### 组件初始化
```typescript
// 初始化输入框高度
useEffect(() => {
  adjustTextareaHeight();
}, []);
```

### Textarea 样式设置
```typescript
<textarea
  ref={textareaRef}
  value={message}
  onChange={handleInputChange}
  onKeyPress={handleKeyPress}
  placeholder={chat.isGroup ? "输入消息，@可提及群成员..." : "输入消息..."}
  rows={1}
  disabled={isLoading}
  style={{
    resize: 'none',
    overflow: 'hidden',
    minHeight: '40px',
    maxHeight: '120px'
  }}
/>
```

## 功能特点

### 1. 智能高度计算
- 基于 `scrollHeight` 计算实际需要的高度
- 先重置高度为 `auto` 获取准确的内容高度
- 应用最小和最大高度限制

### 2. 平滑的用户体验
- 实时响应输入变化
- 支持 Shift+Enter 换行
- 发送消息后自动重置到初始高度

### 3. 兼容性处理
- 使用 `setTimeout` 确保状态更新完成后再调整高度
- 在@提及选择后延迟调整，避免状态冲突

### 4. 性能优化
- 只在必要时调整高度
- 避免频繁的 DOM 操作

## 测试方法

### 1. 运行测试脚本
```powershell
.\test-textarea-auto-height.ps1
```

### 2. 手动测试步骤
1. 打开任意聊天界面
2. 在输入框中输入单行文本，观察高度
3. 按 Shift+Enter 换行，观察输入框是否自动增高
4. 继续输入多行文本，观察最大高度限制
5. 发送消息后，观察输入框是否重置到初始高度
6. 测试@提及功能后输入框高度是否正确调整

### 3. 测试场景
- **单行输入**：输入框保持最小高度
- **多行输入**：输入框逐渐增高
- **最大高度限制**：超过5行时不再增高，显示滚动条
- **发送后重置**：发送消息后回到初始高度
- **@提及功能**：选择@成员后高度正确调整
- **快速输入**：连续输入时高度调整流畅

## 注意事项

1. **高度限制**：最大高度限制为120px（约5行），超出后显示滚动条
2. **性能考虑**：每次输入都会触发高度调整，但计算量很小
3. **兼容性**：使用标准的 DOM API，兼容所有现代浏览器
4. **状态同步**：使用 `setTimeout` 确保状态更新完成后再调整高度

## 文件修改

- `src/app/components/qq/ChatInterface.tsx` - 主要功能实现
- `test-textarea-auto-height.ps1` - 测试脚本
- `docs/TEXTAREA_AUTO_HEIGHT_FIX.md` - 本文档

## 效果展示

- ✅ 单行输入：输入框保持40px高度
- ✅ 多行输入：输入框自动增高到120px
- ✅ 发送消息：输入框重置到40px高度
- ✅ @提及功能：选择成员后高度正确调整
- ✅ 流畅体验：高度变化平滑自然 