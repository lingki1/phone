# Unicode表情功能

## 功能概述

在ChatInterface中添加了Telegram风格的Unicode表情选择器，用户可以方便地插入各种Unicode表情符号到聊天消息中。

## 功能特性

### 1. 表情分类
- **最近使用**: 显示最近使用的10个表情
- **表情**: 各种面部表情和人物表情
- **手势**: 手势、身体部位等
- **动物**: 各种动物和植物
- **食物**: 各种食物和饮料
- **活动**: 运动和娱乐活动
- **旅行**: 交通工具和地点
- **物品**: 日常用品和工具
- **符号**: 各种符号和标志

### 2. 用户体验
- **最近使用记录**: 自动记录用户最近使用的表情
- **分类导航**: 顶部分类标签快速切换
- **响应式设计**: 支持桌面端和移动端
- **深色模式**: 自动适配系统深色模式
- **动画效果**: 平滑的打开/关闭动画

### 3. 技术实现
- **组件化设计**: 独立的UnicodeEmojiPicker组件
- **TypeScript支持**: 完整的类型定义
- **CSS隔离**: 使用Unicode前缀避免样式冲突
- **性能优化**: 使用useCallback和useMemo优化渲染

## 文件结构

```
src/app/components/Unicode/
├── UnicodeEmojiPicker.tsx    # 表情选择器组件
└── UnicodeEmojiPicker.css    # 表情选择器样式
```

## 使用方法

### 1. 在ChatInterface中的集成

表情按钮已添加到输入框左侧的功能按钮行中，位于红包按钮旁边：

```tsx
// 表情按钮
<button 
  ref={emojiButtonRef}
  className="action-btn unicode-emoji-btn"
  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
  disabled={isLoading || isPending}
  title="表情"
>
  <span className="btn-icon">
    <svg>...</svg>
  </span>
  <span className="btn-text">表情</span>
</button>

// 表情选择器
<UnicodeEmojiPicker
  isOpen={showEmojiPicker}
  onClose={() => setShowEmojiPicker(false)}
  onEmojiSelect={handleEmojiSelect}
  triggerRef={emojiButtonRef}
/>
```

### 2. 表情选择处理

```tsx
const handleEmojiSelect = useCallback((emoji: string) => {
  if (isStoryMode) {
    setStoryModeInput(prev => prev + emoji);
  } else {
    setMessage(prev => prev + emoji);
  }
  setShowEmojiPicker(false);
  
  // 延迟调整输入框高度
  setTimeout(() => {
    adjustTextareaHeight();
    textareaRef.current?.focus();
  }, 0);
}, [isStoryMode, adjustTextareaHeight]);
```

## 样式特性

### 1. 响应式设计
- **桌面端**: 320px宽度，8列网格布局
- **移动端**: 全屏宽度，6列网格布局
- **自适应高度**: 根据屏幕大小调整

### 2. 视觉效果
- **圆角设计**: 12px圆角，现代化外观
- **阴影效果**: 柔和的阴影提升层次感
- **悬停动画**: 表情按钮悬停时缩放效果
- **平滑过渡**: 所有交互都有平滑的过渡动画

### 3. 深色模式支持
```css
@media (prefers-color-scheme: dark) {
  .unicode-emoji-picker {
    background: #1a1a1a;
    border-color: #333;
  }
  
  .emoji-picker-header {
    background: #2d2d2d;
  }
}
```

## 数据持久化

### 最近使用表情
- 使用localStorage存储最近使用的表情
- 最多保存10个表情
- 自动去重和排序

```tsx
// 保存最近使用表情
const newRecent = [emoji, ...recentEmojis.filter(e => e !== emoji)].slice(0, 10);
localStorage.setItem('recentEmojis', JSON.stringify(newRecent));
```

## 兼容性

### 浏览器支持
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### 设备支持
- 桌面端：Windows, macOS, Linux
- 移动端：iOS Safari, Android Chrome
- 平板端：iPad, Android平板

## 性能优化

### 1. 渲染优化
- 使用React.memo避免不必要的重渲染
- 使用useCallback缓存事件处理函数
- 使用useMemo缓存计算结果

### 2. 内存优化
- 表情数据静态定义，避免重复创建
- 及时清理事件监听器
- 合理使用useRef避免闭包问题

### 3. 用户体验优化
- 防抖处理输入框高度调整
- 延迟聚焦输入框避免闪烁
- 平滑的动画过渡

## 未来扩展

### 1. 功能扩展
- 表情搜索功能
- 自定义表情包支持
- 表情收藏功能
- 表情使用统计

### 2. 性能优化
- 虚拟滚动支持大量表情
- 懒加载表情图片
- 表情缓存机制

### 3. 用户体验
- 表情预览功能
- 表情组合建议
- 表情使用历史
- 表情分类自定义

## 注意事项

1. **样式隔离**: 使用Unicode前缀避免与其他组件样式冲突
2. **类型安全**: 完整的TypeScript类型定义确保类型安全
3. **无障碍支持**: 支持键盘导航和屏幕阅读器
4. **国际化**: 表情分类名称支持多语言
5. **错误处理**: 完善的错误处理和边界情况处理
