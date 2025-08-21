import { PromptContext, PromptInjector } from '../types';
import { dataManager } from '../../../utils/dataManager';
import { Message } from '../../../types/chat';

export class MemoryInjector implements PromptInjector {
  priority = 20; // 记忆注入优先级较高，在基础模板之后

  async inject(context: PromptContext): Promise<string> {
    try {
      const memoryInjector = new MemoryInjectorInstance(context);
      const crossModeMemory = await memoryInjector.injectCrossModeMemory();
      const memorySummary = await memoryInjector.injectMemorySummary();
      const memoryStats = await memoryInjector.injectMemoryStats();
      
      let injectedContent = '';
      
      if (crossModeMemory) {
        injectedContent += crossModeMemory;
      }
      
      if (memorySummary) {
        injectedContent += memorySummary;
      }
      
      if (memoryStats) {
        injectedContent += memoryStats;
      }
      
      return injectedContent;
    } catch (error) {
      console.error('MemoryInjector inject failed:', error);
      return '';
    }
  }
}

// 内部实现类
class MemoryInjectorInstance {
  private context: PromptContext;

  constructor(context: PromptContext) {
    this.context = context;
  }

  // 注入跨模式记忆
  async injectCrossModeMemory(): Promise<string> {
    try {
      const { chat } = this.context;
      const isStoryMode = this.context.isStoryMode || false;
      const targetMode = isStoryMode ? 'story' : 'normal';

      // 获取跨模式记忆
      const crossMemory = await dataManager.getCrossModeMemory(chat.id, targetMode);
      
      if (crossMemory.contextMessages.length === 0) {
        return this.generateFirstTimeMemory();
      }

      // 生成记忆注入内容
      return this.generateMemoryInjection(crossMemory, targetMode);
    } catch (error) {
      console.error('Failed to inject cross mode memory:', error);
      return this.generateFirstTimeMemory();
    }
  }

  // 注入记忆摘要
  async injectMemorySummary(): Promise<string> {
    try {
      const { chat } = this.context;
      const memorySummary = await dataManager.getChatMemorySummary(chat.id, 15);
      
      if (memorySummary.totalMessages === 0) {
        return '';
      }

      return this.generateMemorySummaryInjection(memorySummary);
    } catch (error) {
      console.error('Failed to inject memory summary:', error);
      return '';
    }
  }

  // 注入记忆统计信息
  async injectMemoryStats(): Promise<string> {
    try {
      const { chat } = this.context;
      const memoryStats = await dataManager.getChatMemoryStats(chat.id);
      
      if (memoryStats.totalInteractions === 0) {
        return '';
      }

      return this.generateMemoryStatsInjection(memoryStats);
    } catch (error) {
      console.error('Failed to inject memory stats:', error);
      return '';
    }
  }

  // 生成首次对话记忆
  private generateFirstTimeMemory(): string {
    return `
# 记忆状态：首次对话
这是你与用户的第一次对话，请根据角色设定开始互动。`;
  }

  // 生成记忆注入内容
  private generateMemoryInjection(
    crossMemory: {
      contextMessages: Message[];
      modeTransition: string;
      lastMode: 'normal' | 'story' | 'unknown';
    },
    targetMode: 'normal' | 'story'
  ): string {
    const { contextMessages, modeTransition, lastMode } = crossMemory;
    
    // 格式化上下文消息
    const formattedMessages = contextMessages
      .map(msg => {
        const time = new Date(msg.timestamp).toLocaleString('zh-CN', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        if (msg.role === 'user') {
          return `[${time}] 用户: ${msg.content}`;
        } else {
          const senderName = msg.senderName || this.context.chat.name;
          return `[${time}] ${senderName}: ${msg.content}`;
        }
      })
      .join('\n');

    // 生成模式转换说明
    const modeTransitionText = this.generateModeTransitionText(modeTransition, lastMode, targetMode);

    return `
# 记忆状态：${modeTransitionText}

# 最近的对话历史（最近${contextMessages.length}条）：
${formattedMessages}

# 记忆连续性要求：
- 请记住上述对话历史中的关键信息
- 在${targetMode === 'story' ? '剧情模式' : '聊天模式'}中保持角色一致性
- 根据历史对话调整当前回应
- 体现对用户之前提到的内容的记忆和理解`;
  }

  // 生成记忆摘要注入
  private generateMemorySummaryInjection(memorySummary: {
    recentMessages: Message[];
    totalMessages: number;
    lastInteractionTime: number;
    memoryType: 'normal' | 'story' | 'mixed';
  }): string {
    const { recentMessages, totalMessages, lastInteractionTime, memoryType } = memorySummary;
    
    const lastInteractionDate = new Date(lastInteractionTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
# 记忆摘要：
- 总对话次数：${totalMessages}次
- 记忆类型：${this.getMemoryTypeText(memoryType)}
- 最后互动时间：${lastInteractionDate}
- 最近互动：${recentMessages.length}条消息

# 记忆类型说明：
${this.getMemoryTypeDescription(memoryType)}`;
  }

  // 生成记忆统计注入
  private generateMemoryStatsInjection(memoryStats: {
    normalMessageCount: number;
    storyMessageCount: number;
    totalInteractions: number;
    lastNormalInteraction: number;
    lastStoryInteraction: number;
    memoryBalance: 'normal' | 'story' | 'balanced';
  }): string {
    const { normalMessageCount, storyMessageCount, totalInteractions, memoryBalance } = memoryStats;
    
    const normalRatio = totalInteractions > 0 ? (normalMessageCount / totalInteractions * 100).toFixed(1) : '0';
    const storyRatio = totalInteractions > 0 ? (storyMessageCount / totalInteractions * 100).toFixed(1) : '0';

    return `
# 记忆统计：
- 聊天模式互动：${normalMessageCount}次 (${normalRatio}%)
- 剧情模式互动：${storyMessageCount}次 (${storyRatio}%)
- 总互动次数：${totalInteractions}次
- 记忆平衡：${this.getMemoryBalanceText(memoryBalance)}

# 记忆平衡说明：
${this.getMemoryBalanceDescription(memoryBalance)}`;
  }

  // 生成模式转换文本
  private generateModeTransitionText(
    modeTransition: string,
    lastMode: 'normal' | 'story' | 'unknown',
    targetMode: 'normal' | 'story'
  ): string {
    if (lastMode === 'unknown') {
      return '首次对话';
    }
    
    if (lastMode === targetMode) {
      return '继续当前模式';
    }
    
    if (lastMode === 'normal' && targetMode === 'story') {
      return '从线上聊天切换到线下剧情';
    }
    
    if (lastMode === 'story' && targetMode === 'normal') {
      return '从线下剧情切换到线上聊天';
    }
    
    return modeTransition;
  }

  // 获取记忆类型文本
  private getMemoryTypeText(memoryType: 'normal' | 'story' | 'mixed'): string {
    switch (memoryType) {
      case 'normal':
        return '纯聊天模式';
      case 'story':
        return '纯剧情模式';
      case 'mixed':
        return '混合模式';
      default:
        return '未知';
    }
  }

  // 获取记忆类型描述
  private getMemoryTypeDescription(memoryType: 'normal' | 'story' | 'mixed'): string {
    switch (memoryType) {
      case 'normal':
        return '用户主要在聊天模式下与你互动，请保持聊天软件的使用习惯。';
      case 'story':
        return '用户主要在剧情模式下与你互动，请保持故事叙述的连贯性。';
      case 'mixed':
        return '用户在两种模式间自由切换，请根据当前模式调整回应风格，同时保持角色一致性。';
      default:
        return '';
    }
  }

  // 获取记忆平衡文本
  private getMemoryBalanceText(memoryBalance: 'normal' | 'story' | 'balanced'): string {
    switch (memoryBalance) {
      case 'normal':
        return '偏向聊天模式';
      case 'story':
        return '偏向剧情模式';
      case 'balanced':
        return '平衡发展';
      default:
        return '未知';
    }
  }

  // 获取记忆平衡描述
  private getMemoryBalanceDescription(memoryBalance: 'normal' | 'story' | 'balanced'): string {
    switch (memoryBalance) {
      case 'normal':
        return '用户更倾向于聊天模式，请优先考虑聊天软件的交互特点。';
      case 'story':
        return '用户更倾向于剧情模式，请优先考虑故事发展的连贯性。';
      case 'balanced':
        return '用户在两种模式间平衡使用，请灵活调整回应风格。';
      default:
        return '';
    }
  }
}
