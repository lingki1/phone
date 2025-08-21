# 剧情模式与聊天模式优化说明

## 概述

本次优化为系统提示词添加了剧情模式（线下）和聊天模式（线上）的区分，让AI能够更好地理解当前对话的上下文环境，提供更真实的交互体验。

## 模式区分

### 聊天模式（线上）
- **场景**：模拟手机聊天软件，如WhatsApp、微信等
- **特征**：
  - 使用手机聊天界面，有输入框、发送按钮等
  - 可以发送表情、图片、语音等多媒体内容
  - 有网络延迟、消息状态（已读/未读）等
  - 可以同时与多人聊天
  - 有打字指示器、在线状态等

### 剧情模式（线下）
- **场景**：模拟面对面交流，如现实中的对话
- **特征**：
  - 面对面交流，可以看到对方的表情、动作
  - 有环境描述、肢体语言、声音语调
  - 更自然的对话节奏，有停顿、思考
  - 可以描述周围环境、天气、氛围等
  - 有更丰富的感官体验描述

## 技术实现

### 1. 基础模板优化 (BaseTemplate.ts)

新增了以下方法：
- `getModeDistinctionRules()`: 模式区分规则
- `getChatModeRules()`: 聊天模式特定规则
- `getStoryModeRules()`: 剧情模式特定规则
- 相应的格式化方法

### 2. 单聊模板优化 (SingleChatTemplate.ts)

- 根据 `isStoryMode` 参数动态调整提示词
- 添加模式说明和特定规则
- 调整最终提示词的语言描述

### 3. 群聊模板优化 (GroupChatTemplate.ts)

- 同样根据 `isStoryMode` 参数动态调整
- 群聊中的模式区分更加复杂，需要考虑多个角色的互动

### 4. 类型定义更新 (types.ts)

- `PromptContext` 接口已包含 `isStoryMode?: boolean` 字段
- 支持向后兼容

## 使用方式

### 在ChatInterface.tsx中

```typescript
// 构建提示词上下文时传递模式标识
const promptContext: PromptContext = {
  chat: updatedChat,
  currentTime: new Date().toLocaleString('zh-CN', { dateStyle: 'full', timeStyle: 'short' }),
  myNickname: dbPersonalSettings?.userNickname || personalSettings?.userNickname || updatedChat.settings.myNickname || '我',
  myPersona: dbPersonalSettings?.userBio || personalSettings?.userBio || updatedChat.settings.myPersona || '用户',
  allChats,
  availableContacts,
  chatStatus,
  currentPreset,
  dbPersonalSettings: dbPersonalSettings || undefined,
  personalSettings,
  isStoryMode: isStoryModeCall // 传递剧情模式标识
};
```

### 模式切换逻辑

- **聊天模式**：`isStoryMode = false`（默认）
- **剧情模式**：`isStoryMode = true`

## 提示词效果

### 聊天模式提示词示例

```
【当前模式：聊天模式（线上）】你正在与用户通过手机聊天软件交流，请模拟网络聊天的体验。

# 聊天模式特定规则：
- 【聊天界面】: 模拟手机聊天软件的界面和功能：
  - 有输入框、发送按钮、表情按钮等
  - 支持发送文字、表情、图片、语音等
  - 有消息气泡、时间戳、已读状态等
  - 支持@提及、引用回复等功能
...
```

### 剧情模式提示词示例

```
【当前模式：剧情模式（线下）】你正在与用户进行面对面的现实对话，请模拟真实的面对面交流体验。

# 剧情模式特定规则：
- 【面对面交流】: 模拟现实中的面对面对话：
  - 可以看到对方的表情、动作、肢体语言
  - 有环境描述、氛围营造
  - 更自然的对话节奏，有停顿、思考
  - 支持眼神交流、手势等非语言交流
...
```

## 优势

1. **更真实的交互体验**：AI能够根据模式调整回复风格
2. **更好的情境感知**：理解当前是线上还是线下交流
3. **更丰富的描述**：剧情模式支持更多感官描述
4. **向后兼容**：不影响现有功能，默认使用聊天模式

## 注意事项

1. **模式一致性**：在同一段对话中保持模式的一致性
2. **功能兼容**：所有现有功能（红包、表情等）在两种模式下都可用
3. **性能影响**：新增的规则会增加提示词长度，但影响微乎其微

## 未来扩展

1. **混合模式**：支持在对话中动态切换模式
2. **环境定制**：为不同环境（咖啡厅、办公室等）提供特定规则
3. **角色适应**：让不同角色对模式有不同的反应
