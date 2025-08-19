# 剧情模式IndexedDB存储功能

## 概述

本次更新实现了剧情模式消息的IndexedDB持久化存储功能，确保两个模式的聊天内容完全分开独立，并且剧情模式的消息能够持久保存。

## 核心功能

### 1. **数据库存储结构**
- ✅ 新增 `STORY_MODE_MESSAGES_STORE` 存储剧情模式消息
- ✅ 升级数据库版本到 `DB_VERSION = 12`
- ✅ 支持按 `chatId` 存储和检索剧情模式消息

### 2. **数据管理方法**
- ✅ `saveStoryModeMessages(chatId, messages)` - 保存剧情模式消息列表
- ✅ `getStoryModeMessages(chatId)` - 获取剧情模式消息列表
- ✅ `deleteStoryModeMessages(chatId)` - 删除剧情模式消息
- ✅ `addStoryModeMessage(chatId, message)` - 添加单条剧情模式消息

### 3. **完全独立的消息存储**
- ✅ 剧情模式消息与普通聊天消息完全分离
- ✅ 每个聊天都有独立的剧情模式消息存储
- ✅ 切换模式时不会互相影响

## 技术实现

### 1. **数据库升级**
```typescript
// 升级数据库版本
const DB_VERSION = 12; // 升级数据库版本以支持剧情模式消息存储

// 创建剧情模式消息存储
if (!db.objectStoreNames.contains(STORY_MODE_MESSAGES_STORE)) {
  const storyModeMessagesStore = db.createObjectStore(STORY_MODE_MESSAGES_STORE, { keyPath: 'chatId' });
  storyModeMessagesStore.createIndex('timestamp', 'timestamp', { unique: false });
}
```

### 2. **消息存储结构**
```typescript
// 存储结构
{
  chatId: string,           // 聊天ID
  messages: Message[],      // 剧情模式消息列表
  timestamp: number         // 最后更新时间
}
```

### 3. **消息管理方法**
```typescript
// 保存剧情模式消息
async saveStoryModeMessages(chatId: string, messages: Message[]): Promise<void>

// 获取剧情模式消息
async getStoryModeMessages(chatId: string): Promise<Message[]>

// 添加单条消息
async addStoryModeMessage(chatId: string, message: Message): Promise<void>

// 删除剧情模式消息
async deleteStoryModeMessages(chatId: string): Promise<void>
```

## 功能集成

### 1. **ChatInterface.tsx 集成**
- ✅ 组件初始化时从IndexedDB加载剧情模式消息
- ✅ 发送消息时自动保存到IndexedDB
- ✅ AI回复时自动保存到IndexedDB
- ✅ 切换模式时保留剧情模式消息

### 2. **消息加载逻辑**
```typescript
// 初始化剧情模式消息状态
useEffect(() => {
  const loadStoryModeMessages = async () => {
    try {
      const messages = await dataManager.getStoryModeMessages(chat.id);
      setStoryModeMessages(messages);
      console.log('Story mode messages loaded:', messages.length, 'messages');
    } catch (error) {
      console.error('Failed to load story mode messages:', error);
      setStoryModeMessages([]);
    }
  };

  loadStoryModeMessages();
}, [chat.id]);
```

### 3. **消息保存逻辑**
```typescript
// 发送消息时保存
const handleStoryModeSend = useCallback(async (content: string) => {
  // ... 创建消息对象
  
  // 添加到状态
  setStoryModeMessages(prev => [...prev, userMessage]);
  
  // 保存到IndexedDB
  try {
    await dataManager.addStoryModeMessage(chat.id, userMessage);
    console.log('Story mode message saved to IndexedDB');
  } catch (error) {
    console.error('Failed to save story mode message to IndexedDB:', error);
  }
}, [isLoading, chat, quotedMessage]);

// AI回复时保存
const handleStoryModeAiResponse = useCallback(async (aiMessage: Message) => {
  // 添加到状态
  setStoryModeMessages(prev => [...prev, aiMessage]);
  
  // 保存到IndexedDB
  try {
    await dataManager.addStoryModeMessage(chat.id, aiMessage);
    console.log('Story mode AI response saved to IndexedDB');
  } catch (error) {
    console.error('Failed to save story mode AI response to IndexedDB:', error);
  }
}, [chat]);
```

## 数据管理功能

### 1. **导出/导入支持**
- ✅ 导出数据时包含剧情模式消息
- ✅ 导入数据时恢复剧情模式消息
- ✅ 版本升级到 `1.6`

### 2. **数据清理功能**
- ✅ `clearAllData()` 包含剧情模式消息清理
- ✅ 支持单独删除剧情模式消息

### 3. **统计信息**
- ✅ `getStats()` 包含剧情模式消息统计
- ✅ 显示剧情模式消息总数

## 用户体验改进

### 1. **持久化存储**
- 🎯 剧情模式消息永久保存
- 🎯 刷新页面后消息不丢失
- 🎯 重新打开应用后消息保持

### 2. **模式独立性**
- 🔄 两个模式消息完全分离
- 🔄 切换模式不影响各自消息
- 🔄 独立的消息管理和显示

### 3. **数据完整性**
- 📊 支持数据导出/导入
- 📊 支持数据统计和清理
- 📊 错误处理和恢复机制

## 优势分析

### 1. **技术优势**
- ✅ **完全分离**: 两个模式消息存储完全独立
- ✅ **持久化**: 剧情模式消息永久保存
- ✅ **可扩展**: 易于添加更多消息类型
- ✅ **性能优化**: 按需加载，避免内存占用

### 2. **用户体验**
- 🎭 **数据安全**: 消息不会意外丢失
- 🎭 **模式切换**: 无缝切换，数据保持
- 🎭 **数据管理**: 支持导出、导入、清理
- 🎭 **错误恢复**: 自动错误处理和恢复

## 总结

这次更新成功实现了剧情模式消息的IndexedDB持久化存储功能，确保了两个模式消息的完全独立性，为用户提供了更好的数据安全性和使用体验。剧情模式的消息现在可以永久保存，支持导出导入，并且与普通聊天消息完全分离。
