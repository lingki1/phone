import { PromptInjector, PromptContext, ChatStatus } from '../types';

export class StatusInjector implements PromptInjector {
  priority = 30; // 状态注入优先级最高，在最后注入

  async inject(context: PromptContext): Promise<string> {
    const { chat, chatStatus, isStoryMode } = context;
    
    // 仅在单聊中注入状态，剧情模式也支持状态注入
    if (chat.isGroup || !chatStatus) {
      return '';
    }

    // 注入状态信息
    const statusContent = this.buildStatusContent(chatStatus);
    
    // 检查是否需要触发状态更新
    const shouldTriggerUpdate = this.shouldTriggerStatusUpdate(chatStatus, chat.messages.length);
    
    let additionalContent = '';
    if (shouldTriggerUpdate) {
      if (isStoryMode) {
        additionalContent = `

## 重要：剧情模式状态更新要求
由于距离上次状态更新已经较长时间，请在故事中自然地更新角色状态。
将状态更新融入故事叙述中，不要突兀，让状态变化符合故事逻辑。

示例：在故事叙述中自然地描述角色的心情、位置、穿着等状态变化。`;
      } else {
        additionalContent = `

## 重要：状态更新要求
由于距离上次状态更新已经较长时间，或者这是我们的第一次对话，请务必在回复中包含状态更新指令。
请根据当前时间和情境，更新你的状态信息，让对话更加真实自然。

示例回复格式：
[
  {"type": "status_update", "mood": "当前心情", "location": "当前位置", "outfit": "当前穿着"},
  {"type": "text", "content": "你的回复内容"}
]`;
      }
    }

    return statusContent + additionalContent;
  }

  // 构建状态内容
  private buildStatusContent(chatStatus: ChatStatus): string {
    return `

# 当前状态信息
- **在线状态**: ${chatStatus.isOnline ? '在线' : '离线'}
- **当前心情**: ${chatStatus.mood}
- **当前位置**: ${chatStatus.location}
- **当前穿着**: ${chatStatus.outfit}
- **最后更新**: ${new Date(chatStatus.lastUpdate).toLocaleString('zh-CN')}

请根据以上状态信息，保持角色的一致性和真实感。`;
  }

  // 检查是否需要触发状态更新
  private shouldTriggerStatusUpdate(chatStatus: ChatStatus, messageCount: number): boolean {
    const now = Date.now();
    const lastUpdate = chatStatus.lastUpdate;
    const timeDiff = now - lastUpdate;
    
    // 如果距离上次状态更新超过30分钟，或者这是第一次对话，则触发状态更新
    return timeDiff > 30 * 60 * 1000 || messageCount <= 1;
  }
}
