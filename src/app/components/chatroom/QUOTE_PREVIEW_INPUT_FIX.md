# 引用预览遮挡输入框问题修复

## 问题描述
在引用消息后，引用预览会遮挡输入框，导致用户无法正常输入消息。

## 问题分析
1. **布局结构问题**：引用预览和输入框在同一容器中，没有合理的布局分隔
2. **样式冲突**：引用预览的样式可能影响输入框的可见性
3. **响应式设计缺失**：缺少针对不同屏幕尺寸的布局优化

## 修复方案

### 1. 重新设计输入区域布局
```css
.chatroom-input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* 确保输入容器有足够的空间 */
  min-height: 60px;
}
```

### 2. 创建输入行容器
```css
.chatroom-input-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}
```

### 3. 优化引用预览样式
```css
.chatroom-quote-preview {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 12px;
  /* 确保引用预览不会遮挡输入框 */
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
}
```

### 4. 增强输入框样式
```css
.chatroom-message-input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 1.4;
  max-height: 120px;
  font-family: inherit;
  /* 确保输入框有合适的尺寸 */
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f8f9fa;
}
```

### 5. 优化取消按钮样式
```css
.quote-cancel {
  background: none;
  border: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
  float: right;
}

.quote-cancel:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}
```

## 修复效果
1. ✅ 引用预览不再遮挡输入框
2. ✅ 输入区域布局更加清晰合理
3. ✅ 引用预览和输入框有明确的视觉分隔
4. ✅ 取消按钮样式更加美观
5. ✅ 移动端和桌面端都有良好的体验

## 技术要点
- 使用flexbox布局重新组织输入区域
- 通过z-index和position确保正确的层级关系
- 为不同元素设置合适的间距和尺寸
- 保持响应式设计的兼容性

## 测试建议
1. 点击消息进行引用
2. 确认引用预览正确显示
3. 验证输入框可以正常输入
4. 测试取消引用的功能
5. 在不同屏幕尺寸下测试布局
