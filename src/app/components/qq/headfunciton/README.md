# Chat Header Functions

这个文件夹包含了聊天界面顶部功能按键的组件，用于简化ChatInterface组件的代码结构。

## 组件结构

### ChatHeader.tsx
主要的头部组件，整合了聊天信息和功能按键。

### ChatHeaderInfo.tsx
显示聊天信息的组件，包括头像、名称和状态。

### ChatHeaderActions.tsx
包含所有功能按键的组件，包括：
- 世界书关联管理
- 设置额外信息
- 设置聊天背景
- 查看礼物记录
- 快速切换人设
- 记忆管理（群聊/单聊）
- 群成员管理（仅群聊）

## 使用方法

```tsx
import { ChatHeader } from './headfunciton';

<ChatHeader
  chat={chat}
  chatStatus={chatStatus}
  onBack={onBack}
  onShowWorldBookAssociationSwitch={() => setShowWorldBookAssociationSwitch(true)}
  onShowExtraInfoSettings={() => setShowExtraInfoSettings(true)}
  onShowBackgroundModal={() => setShowBackgroundModal(true)}
  onShowGiftHistory={() => setShowGiftHistory(true)}
  onShowMemoryManager={() => setShowMemoryManager(true)}
  onShowMemberManager={() => setShowMemberManager(true)}
  onShowSingleChatMemoryManager={() => setShowSingleChatMemoryManager(true)}
  personalSettings={personalSettings}
  dbPersonalSettings={dbPersonalSettings}
/>
```

## 扩展新功能

要添加新的功能按键：

1. 在`ChatHeaderActions.tsx`中添加新的按钮
2. 在`ChatHeader.tsx`中添加对应的props和回调函数
3. 在`ChatInterface.tsx`中传递相应的状态管理函数

## 样式

组件使用现有的CSS类名，确保与原有样式保持一致。
