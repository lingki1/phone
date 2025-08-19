# 统一输入框更新

## 更新内容

### 1. 输入框统一
- ✅ 将剧情模式和聊天模式的输入框合并为一个
- ✅ 使用相同的输入框样式和布局
- ✅ 切换模式时输入框不会变形或改变位置

### 2. 状态管理优化
- ✅ 添加了`storyModeInput`状态来管理剧情模式的输入内容
- ✅ 切换模式时自动清空输入内容
- ✅ 保持两种模式的输入状态独立

### 3. 按钮文案动态切换
- ✅ 发送按钮：剧情模式显示"继续"，聊天模式显示"发送"
- ✅ AI生成按钮：剧情模式显示"AI生成"，聊天模式显示"AI回复"
- ✅ 占位符文本根据模式动态变化

## 技术实现

### 统一输入框结构
```tsx
<div className="input-wrapper">
  <textarea
    ref={textareaRef}
    value={isStoryMode ? storyModeInput : message}
    onChange={isStoryMode ? (e) => setStoryModeInput(e.target.value) : handleInputChange}
    onKeyPress={isStoryMode ? storyModeKeyPress : handleKeyPress}
    placeholder={dynamicPlaceholder}
    // ... 其他属性
  />
  <div className="send-buttons">
    <button onClick={isStoryMode ? storyModeSend : handleSendMessage}>
      <span className="btn-text">{isStoryMode ? "继续" : "发送"}</span>
    </button>
    <button onClick={isStoryMode ? handleStoryModeGenerate : handleGenerateAI}>
      <span className="btn-text">{isStoryMode ? "AI生成" : "AI回复"}</span>
    </button>
  </div>
</div>
```

### 状态管理
```tsx
// 剧情模式相关状态
const [isStoryMode, setIsStoryMode] = useState(false);
const [storyModeInput, setStoryModeInput] = useState('');

// 切换模式时清空输入
const handleStoryModeToggle = useCallback(() => {
  setIsStoryMode(prev => !prev);
  setStoryModeInput('');
  setMessage('');
}, []);
```

### 动态占位符
```tsx
placeholder={
  isPending 
    ? (isStoryMode ? "AI正在生成剧情中，请稍候..." : "AI正在回复中，请稍候...")
    : (isStoryMode ? "继续编写剧情..." : (chat.isGroup ? "输入消息，@可提及群成员..." : "输入消息..."))
}
```

## 用户体验改进

### 1. 视觉一致性
- 输入框在两种模式下保持相同的尺寸和样式
- 切换模式时没有布局跳动
- 按钮位置和大小保持一致

### 2. 交互体验
- 切换模式时自动清空输入内容，避免混淆
- 按钮文案清晰表明当前模式的功能
- 占位符文本提供模式相关的提示

### 3. 功能完整性
- 两种模式都支持Enter键发送
- 按钮禁用状态正确响应输入内容
- 保持所有原有功能不变

## 代码优化

### 移除冗余组件
- 不再使用`StoryModeInput`组件
- 减少了代码重复
- 简化了组件结构

### 状态管理简化
- 统一的输入框减少了状态管理的复杂性
- 更清晰的数据流
- 更容易维护和扩展

## 兼容性

- ✅ 完全兼容现有功能
- ✅ 保持原有的消息处理逻辑
- ✅ 支持所有现有的输入功能
- ✅ 响应式设计保持不变

## 总结

这次更新成功统一了剧情模式和聊天模式的输入框，解决了切换模式时输入框变形的问题。用户现在可以在两种模式之间无缝切换，享受一致的输入体验，同时保持每种模式的独特功能。

