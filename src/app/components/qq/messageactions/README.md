# MessageActionButtons 组件

## 概述

`MessageActionButtons` 是一个符合 ChatGPT 设计风格的消息功能按键组件，提供引用、编辑、重新生成和删除等操作功能。组件采用现代化的设计语言，支持主题配色系统，并针对不同移动设备进行了优化。

## 功能特性

### 核心功能
- **引用消息**: 引用选中的消息内容
- **编辑消息**: 编辑用户发送的消息（仅用户消息）
- **重新生成**: 重新生成AI回复（仅AI消息）
- **删除消息**: 删除选中的消息

### 设计特性
- **ChatGPT风格**: 采用简洁、现代的设计语言
- **主题适配**: 完全支持主题配色系统，自动适配所有主题
- **响应式设计**: 针对不同屏幕尺寸和触摸设备优化
- **无障碍支持**: 完整的ARIA标签和键盘导航支持
- **动画效果**: 流畅的过渡动画和微交互

### 技术特性
- **SVG图标**: 使用矢量图标，确保清晰度和可扩展性
- **CSS变量**: 完全基于主题CSS变量，支持动态主题切换
- **触摸优化**: 针对移动设备的触摸目标大小优化
- **性能优化**: 轻量级实现，最小化重渲染

## 使用方法

```tsx
import { MessageActionButtons } from '../messageactions';

<MessageActionButtons
  message={message}
  isUserMessage={isUserMessage}
  isAIMessage={isAIMessage}
  onQuoteMessage={handleQuote}
  onEditMessage={handleEdit}
  onDeleteMessage={handleDelete}
  onRegenerateAI={handleRegenerate}
/>
```

## Props 接口

```typescript
interface MessageActionButtonsProps {
  message: Message;                    // 消息对象
  isUserMessage: boolean;             // 是否为用户消息
  isAIMessage: boolean;               // 是否为AI消息
  onQuoteMessage: (message: Message) => void;           // 引用消息回调
  onEditMessage: (messageId: string, currentContent: string) => void;  // 编辑消息回调
  onDeleteMessage: (messageId: string) => void;         // 删除消息回调
  onRegenerateAI?: (messageId: string) => void;         // 重新生成AI回调（可选）
}
```

## 设计规范

### 视觉设计
- **主按键**: 32px × 32px 的三点菜单图标
- **面板**: 圆角8px，带阴影和边框
- **功能按键**: 最小高度36px，带图标和文字
- **间距**: 统一的内边距和间距规范

### 颜色系统
- **默认状态**: 使用 `--theme-text-secondary` 颜色
- **悬停状态**: 使用 `--theme-accent-color` 颜色
- **背景**: 使用 `--theme-bg-primary` 和 `--theme-bg-secondary`
- **边框**: 使用 `--theme-border-color`
- **阴影**: 使用 `--theme-shadow-medium`

### 响应式断点
- **桌面端**: 32px 主按键，36px 功能按键
- **平板端** (≤768px): 36px 主按键，40px 功能按键
- **手机端** (≤480px): 40px 主按键，44px 功能按键
- **触摸设备**: 44px 主按键，48px 功能按键

## 主题适配

组件完全支持项目的主题配色系统，包括：

### 支持的主题
- **默认白色**: 简洁清爽
- **深色模式**: 护眼深色
- **男性风格**: 深蓝商务风
- **女性风格**: 粉色温柔风
- **二次元**: 紫色梦幻风
- **可爱风格**: 橙色活泼风
- **金属风格**: 银灰科技风
- **森林主题**: 绿色自然风
- **海洋主题**: 蓝绿渐变风
- **夕阳主题**: 橙红渐变风
- **极简主题**: 黑白简约风

### 主题特性
- **自动适配**: 无需额外配置，自动适配所有主题
- **平滑过渡**: 主题切换时的平滑动画效果
- **特殊优化**: 针对不同主题的视觉优化

## 无障碍支持

### ARIA 标签
- `aria-label`: 为所有按键提供描述性标签
- `aria-expanded`: 指示面板展开状态
- `title`: 提供工具提示信息

### 键盘导航
- 支持 Tab 键导航
- 支持 Enter 和 Space 键激活
- 支持 Escape 键关闭面板

### 高对比度模式
- 自动适配系统高对比度设置
- 增强边框和背景对比度

## 性能优化

### 渲染优化
- 使用 `useState` 管理本地状态
- 避免不必要的重渲染
- 轻量级CSS动画

### 内存管理
- 及时清理事件监听器
- 优化组件卸载逻辑

## 浏览器兼容性

### 支持的浏览器
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

### 特性支持
- CSS Grid 和 Flexbox
- CSS 变量
- SVG 图标
- 现代 JavaScript 特性

## 开发指南

### 添加新功能
1. 在 `MessageActionButtonsProps` 接口中添加新的回调函数
2. 在组件中添加新的按钮元素
3. 在CSS中添加相应的样式
4. 更新文档和类型定义

### 样式定制
- 修改CSS变量以适配新主题
- 调整响应式断点以适配新设备
- 更新动画效果以提升用户体验

## 更新日志

### v2.0.0 (当前版本)
- 🎨 重新设计为 ChatGPT 风格
- 🌈 完全支持主题配色系统
- 📱 优化移动设备适配
- 🔧 使用 SVG 图标替换 emoji
- ♿ 增强无障碍支持
- ⚡ 性能优化和代码重构

### v1.0.0
- 🚀 初始版本发布
- 📋 基础功能实现
- �� 响应式设计
- 🎯 触摸设备优化
