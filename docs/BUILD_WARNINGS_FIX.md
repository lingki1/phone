# 构建警告修复

## 问题描述

在运行 `npm run build` 时出现以下 TypeScript ESLint 警告：

```
Warning: 'dbPersonalSettings' is defined but never used.  @typescript-eslint/no-unused-vars
Warning: 'personalSettings' is defined but never used.  @typescript-eslint/no-unused-vars
```

## 问题原因

在之前的剧情模式布局优化中，我们移除了头像显示功能，导致 `StoryModeDisplay` 组件中不再使用 `dbPersonalSettings` 和 `personalSettings` 参数，但这些参数仍然在接口定义和函数参数中存在。

## 修复内容

### 1. 清理 StoryModeDisplay 组件接口

从 `StoryModeDisplayProps` 接口中移除了不再使用的参数：

```typescript
// 移除前
interface StoryModeDisplayProps {
  messages: Message[];
  chat: ChatItem;
  dbPersonalSettings?: {
    userAvatar: string;
    userNickname: string;
    userBio: string;
  } | null;
  personalSettings?: {
    userAvatar: string;
    userNickname: string;
    userBio: string;
  };
  // ... 其他参数
}

// 移除后
interface StoryModeDisplayProps {
  messages: Message[];
  chat: ChatItem;
  // ... 其他参数
}
```

### 2. 更新函数参数

从 `StoryModeDisplay` 组件的函数参数中移除了不再使用的参数：

```typescript
// 移除前
export default function StoryModeDisplay({
  messages,
  chat,
  dbPersonalSettings,
  personalSettings,
  // ... 其他参数
}: StoryModeDisplayProps) {

// 移除后
export default function StoryModeDisplay({
  messages,
  chat,
  // ... 其他参数
}: StoryModeDisplayProps) {
```

### 3. 更新调用方

在 `ChatInterface.tsx` 中更新了 `StoryModeDisplay` 组件的调用，移除了不再需要的参数传递：

```typescript
// 移除前
<StoryModeDisplay
  messages={storyModeMessages}
  chat={chat}
  dbPersonalSettings={dbPersonalSettings}
  personalSettings={personalSettings}
  // ... 其他参数
/>

// 移除后
<StoryModeDisplay
  messages={storyModeMessages}
  chat={chat}
  // ... 其他参数
/>
```

## 验证结果

修复后重新运行 `npm run build`，构建成功且没有任何警告：

```
✓ Compiled successfully in 11.0s
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (10/10)
✓ Collecting build traces
✓ Finalizing page optimization
```

## 影响范围

- **文件**: 
  - `src/app/components/qq/storymode/StoryModeDisplay.tsx`
  - `src/app/components/qq/ChatInterface.tsx`
- **功能**: 剧情模式消息显示
- **兼容性**: 完全向后兼容，不影响任何现有功能

## 注意事项

- `MessageItem` 组件仍然保留 `dbPersonalSettings` 和 `personalSettings` 参数，因为它仍然需要显示头像
- 只有剧情模式的消息显示组件移除了这些参数，因为剧情模式不再显示头像
