### API 注入对比：剧情模式 vs 线上聊天模式

这份简明指南说明每次调用聊天 API 时，两种模式的“系统提示词注入”和“消息载荷”区别。

## TL;DR
- 系统提示词 = 基础模板 + 注入器（按优先级执行）
- 两种模式都会把“线上+剧情”的历史通过记忆注入写进系统提示词
- 消息载荷来源不同：
  - 线上模式用 `chat.messages`
  - 剧情模式用 `storyModeMessages`（调用时覆盖到 `chat.messages`）
- API 参数（温度、max_tokens 等）一致，由预设或默认值提供

## 模式触发与上下文
- 入口：`ChatInterface` 的 `triggerAiResponse(updatedChat, isStoryModeCall?)`
- 剧情模式：调用时传 `true`，并把 `storyModeMessages` 覆盖到 `chat.messages` 作为上下文
- 提示词构建：`PromptManager.buildPrompt(context)`；`context.isStoryMode` 控制模板与注入器

## 系统提示词组成
- 基础模板（Base Template）
  - 线上：`SingleChatTemplate` 或 `GroupChatTemplate`
  - 剧情：`StoryModeTemplate`
- 注入器（按优先级）
  - 常规：`PresetInjector` → `WorldBookInjector` → `MemoryInjector` → `StatusInjector` → `ItemInjector`
  - 剧情专用（仅剧情模式执行）：`StoryModeInjector` → `NarrativeStyleInjector` → `CharacterStateInjector`

## 记忆注入（MemoryInjector）
- 注入内容（两模式相同）：
  - 跨模式记忆（最近上下文，合并线上+剧情，取最近若干条 user/assistant）
  - 记忆摘要（总条数、最后互动时间、记忆类型 normal/story/mixed）
  - 记忆统计（线上/剧情占比、平衡状态）
- 数据来源：`dataManager.getChatMemory(chatId, true)` 合并 `chat.messages` 与 `getStoryModeMessages(chatId)` 后按时间排序
- 目标模式：根据 `isStoryMode` 推断 `targetMode`，用于生成“模式转换说明”和连续性要求

## 消息载荷（messages payload）
- 取最近 N 条历史（默认 20，可被 `localStorage.globalSettings.maxMemory` 覆盖）
- 按文本行格式化（带 sender 与 Timestamp）；图片/语音/红包会生成可读描述
- 来源差异：
  - 线上：直接使用 `chat.messages`
  - 剧情：使用剧情消息列表（调用前已覆盖到 `chat.messages`）

## API 参数（api params）
- 来源优先级：预设（`PresetInjector`） > 默认
- 默认：`temperature=0.8`、`max_tokens=8000`、`top_p=0.8`、`frequency_penalty=0`、`presence_penalty=0`

## 代码定位（方便检索）
- 调用与覆盖：`src/app/components/qq/ChatInterface.tsx`
- 模板/注入器与载荷：`src/app/components/systemprompt/core/PromptManager.ts`
- 记忆注入实现：`src/app/components/systemprompt/injectors/MemoryInjector.ts`
- 合并历史数据：`src/app/utils/dataManager.ts`

## 可配置建议（可选）
- 剧情模式不引用线上历史：提供全局/会话级开关，禁用 MemoryInjector 的“跨模式合并”，或在剧情模式仅用剧情消息做记忆
- 线上模式限制剧情历史：限制 MemoryInjector 在线上模式下引用剧情消息的数量/比例
