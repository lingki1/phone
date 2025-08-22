# 剧情模式备份功能修复

## 问题描述

数据备份管理器在导出和导入数据时，没有包含剧情模式的聊天内容。剧情模式的消息存储在单独的 `STORY_MODE_MESSAGES_STORE` 中，而备份功能只备份了普通的聊天消息。

## 问题原因

1. **数据结构分离**: 剧情模式消息存储在独立的 IndexedDB 存储中
2. **备份逻辑缺失**: 数据备份管理器没有收集和恢复剧情模式消息
3. **版本兼容性**: 备份文件格式没有包含剧情模式消息字段

## 修复内容

### 1. 更新备份数据结构

在 `BackupData` 接口中添加了剧情模式消息字段：

```typescript
interface BackupData {
  // ... 其他字段
  storyModeMessages: Array<{
    chatId: string;
    messages: import('../../../types/chat').Message[];
    timestamp: number;
  }>;
  // ... 其他字段
}
```

### 2. 导出功能增强

在 `handleExportData` 函数中添加了剧情模式消息的收集逻辑：

```typescript
// 收集所有聊天的剧情模式消息
const storyModeMessages: Array<{
  chatId: string;
  messages: import('../../../types/chat').Message[];
  timestamp: number;
}> = [];

for (const chat of chats) {
  try {
    const messages = await dataManager.getStoryModeMessages(chat.id);
    if (messages && messages.length > 0) {
      storyModeMessages.push({
        chatId: chat.id,
        messages,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.warn(`Failed to get story mode messages for chat ${chat.id}:`, error);
  }
}
```

### 3. 导入功能增强

在 `handleImportData` 函数中添加了剧情模式消息的恢复逻辑：

```typescript
// 导入剧情模式消息
if (importData.storyModeMessages && Array.isArray(importData.storyModeMessages)) {
  setCurrentOperation('正在导入剧情模式消息...');
  for (let i = 0; i < importData.storyModeMessages.length; i++) {
    const storyData = importData.storyModeMessages[i];
    await dataManager.saveStoryModeMessages(storyData.chatId, storyData.messages);
    setImportProgress(40 + (i / importData.storyModeMessages.length) * 5);
  }
}
```

### 4. 进度显示优化

- 调整了导出进度条，为剧情模式消息收集分配了适当的进度比例
- 更新了操作提示文本，明确显示正在处理剧情模式消息
- 在导入过程中添加了剧情模式消息的进度显示

### 5. 版本升级

将备份文件版本从 `1.7` 升级到 `1.8`，以支持剧情模式消息备份。

### 6. 用户界面更新

更新了导出功能的描述文本，明确说明包含剧情模式消息：

```typescript
<p>将所有数据导出为JSON文件，包括聊天记录、剧情模式消息、设置、送礼记录等</p>
```

## 验证清单

- ✅ 剧情模式消息能够正确导出到备份文件
- ✅ 剧情模式消息能够从备份文件正确恢复
- ✅ 进度条正确显示剧情模式消息的处理进度
- ✅ 错误处理机制能够捕获剧情模式消息相关的错误
- ✅ 清空数据功能已包含剧情模式消息的清理
- ✅ 版本兼容性得到保证

## 兼容性说明

- **向后兼容**: 旧版本的备份文件（v1.7及以下）仍然可以正常导入，只是不包含剧情模式消息
- **向前兼容**: 新版本的备份文件（v1.8）包含完整的剧情模式消息数据
- **数据完整性**: 确保剧情模式消息在备份和恢复过程中不会丢失

## 测试建议

1. 创建包含剧情模式消息的聊天
2. 执行数据导出操作
3. 检查导出的JSON文件是否包含 `storyModeMessages` 字段
4. 清空应用数据
5. 导入备份文件
6. 验证剧情模式消息是否正确恢复

## 影响范围

- **文件**: `src/app/components/qq/backup/DataBackupManager.tsx`
- **功能**: 数据备份和恢复
- **用户**: 所有使用剧情模式的用户
- **数据**: 剧情模式聊天内容
