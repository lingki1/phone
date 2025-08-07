# 通知组件 - 简化版

## 修改说明

根据用户需求，对通知组件进行了以下简化：

### ✅ 已完成的修改

1. **一行显示所有内容**
   - 标题、消息、时间现在都在同一行显示
   - 使用 flexbox 布局，消息内容会自动省略过长部分
   - 时间显示在右侧

2. **删除查看按钮**
   - 移除了 `action` 按钮相关的代码
   - 简化了组件结构，只保留关闭按钮

3. **使用系统主题配色**
   - 所有颜色都使用 CSS 变量（`--theme-*`）
   - 支持深色主题自动适配
   - 与整体应用主题保持一致

### 🎨 样式特性

- **主题适配**: 使用 `var(--theme-bg-primary)`, `var(--theme-text-primary)` 等变量
- **响应式设计**: 移动端友好的布局
- **动画效果**: 平滑的进入和退出动画
- **类型区分**: 不同通知类型有不同的左边框颜色
- **自动移除**: 支持设置自动移除时间

### 📱 响应式支持

- 桌面端: 最大宽度 400px
- 平板端: 最大宽度 calc(100vw - 40px)
- 手机端: 最大宽度 calc(100vw - 20px)

### 🎯 使用示例

```tsx
import { NotificationItem, createTestNotification } from './notice';

const notification = createTestNotification(
  'info',
  '新消息',
  '您有一条新的聊天消息'
);

<NotificationItem
  notification={notification}
  onRemove={(id) => console.log('移除通知:', id)}
/>
```

### 🔧 CSS 变量使用

通知组件使用以下系统主题变量：

- `--theme-bg-primary`: 主背景色
- `--theme-bg-secondary`: 次要背景色
- `--theme-text-primary`: 主文本色
- `--theme-text-secondary`: 次要文本色
- `--theme-text-tertiary`: 第三级文本色
- `--theme-border-color`: 边框色
- `--theme-shadow-medium`: 阴影效果
- `--theme-accent-color`: 强调色（用于进度条）

这些变量会根据当前主题自动切换，确保通知组件与整体应用风格保持一致。 