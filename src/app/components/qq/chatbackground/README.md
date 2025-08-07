# 聊天背景管理器 - 主题配色修复

## 修复说明

修复了聊天背景没有采用系统主题配色的问题，确保当用户使用自定义背景图时能正确覆盖主题背景。

### ✅ 已完成的修复

1. **使用系统主题配色**
   - 聊天背景容器现在使用 `var(--theme-bg-primary)` 作为默认背景色
   - 主题背景层使用 `var(--theme-bg-secondary)` 作为次要背景色
   - 支持所有系统主题的自动适配

2. **分层背景架构**
   - **主题背景层**: 当没有自定义背景时显示，使用系统主题配色
   - **自定义背景图片层**: 当有自定义背景时显示，覆盖主题背景
   - **内容层**: 确保聊天内容始终在最上层

3. **主题适配支持**
   - 深色主题 (`theme-dark`)
   - 男性风格 (`theme-masculine`)
   - 女性风格 (`theme-feminine`)
   - 二次元 (`theme-anime`)
   - 可爱风格 (`theme-cute`)
   - 金属风格 (`theme-metal`)
   - 森林主题 (`theme-forest`)
   - 海洋主题 (`theme-ocean`)
   - 夕阳主题 (`theme-sunset`)
   - 极简主题 (`theme-minimal`)

### 🎨 背景层级结构

```
聊天背景容器 (chat-background-container)
├── 主题背景层 (theme-background-layer) - z-index: -2
│   └── 使用系统主题配色，仅在没有自定义背景时显示
├── 自定义背景图片层 (chat-background-image) - z-index: -1
│   └── 使用用户设置的背景图片，覆盖主题背景
└── 内容层 (chat-content-layer) - z-index: 1
    └── 聊天界面内容
```

### 🔧 CSS 变量使用

背景管理器使用以下系统主题变量：

- `--theme-bg-primary`: 主背景色
- `--theme-bg-secondary`: 次要背景色
- `--theme-gradient`: 主题渐变（如果支持）

### 📱 响应式支持

- 移动端优化：减少过渡动画时间以节省电量
- 减少动画偏好：支持 `prefers-reduced-motion` 设置
- 平滑过渡：背景切换时有平滑的过渡效果

### 🎯 使用方式

```tsx
<ChatBackgroundManager
  chatId={chat.id}
  onBackgroundChange={(background, animation) => {
    // 处理背景变更
  }}
>
  {/* 聊天界面内容 */}
</ChatBackgroundManager>
```

### 🔄 背景切换逻辑

1. **无自定义背景**: 显示系统主题配色背景
2. **有自定义背景**: 显示用户设置的背景图片，覆盖主题背景（透明度80%）
3. **背景切换**: 平滑过渡，支持动画效果
4. **主题切换**: 自动适配新主题的配色方案

### 🎨 透明度设置

- **用户自定义背景**: 透明度80%（opacity: 0.8）
- **主题背景层**: 透明度10%（opacity: 0.1）
- **呼吸动画**: 透明度在80%-90%之间变化

现在聊天背景完全使用系统主题配色，并且自定义背景图能正确覆盖主题背景！ 