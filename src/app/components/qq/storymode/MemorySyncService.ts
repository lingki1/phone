import { dataManager } from '../../../utils/dataManager';
import { Message } from '../../../types/chat';

export class MemorySyncService {
  private static instance: MemorySyncService;

  private constructor() {}

  static getInstance(): MemorySyncService {
    if (!MemorySyncService.instance) {
      MemorySyncService.instance = new MemorySyncService();
    }
    return MemorySyncService.instance;
  }

  // 获取完整的聊天记忆（包括两种模式）
  async getCompleteChatMemory(chatId: string): Promise<{
    normalMessages: Message[];
    storyMessages: Message[];
    allMessages: Message[];
    memoryStats: {
      normalCount: number;
      storyCount: number;
      totalCount: number;
      lastNormalTime: number;
      lastStoryTime: number;
    };
  }> {
    try {
      // 获取普通聊天消息
      const chat = await dataManager.getChat(chatId);
      const normalMessages = chat ? chat.messages : [];
      
      // 获取剧情模式消息
      const storyMessages = await dataManager.getStoryModeMessages(chatId);
      
      // 合并所有消息并按时间排序
      const allMessages = [...normalMessages, ...storyMessages]
        .sort((a, b) => a.timestamp - b.timestamp);
      
      // 计算统计信息
      const lastNormalTime = normalMessages.length > 0 
        ? Math.max(...normalMessages.map(msg => msg.timestamp))
        : 0;
      
      const lastStoryTime = storyMessages.length > 0
        ? Math.max(...storyMessages.map(msg => msg.timestamp))
        : 0;
      
      return {
        normalMessages,
        storyMessages,
        allMessages,
        memoryStats: {
          normalCount: normalMessages.length,
          storyCount: storyMessages.length,
          totalCount: allMessages.length,
          lastNormalTime,
          lastStoryTime
        }
      };
    } catch (error) {
      console.error('Failed to get complete chat memory:', error);
      return {
        normalMessages: [],
        storyMessages: [],
        allMessages: [],
        memoryStats: {
          normalCount: 0,
          storyCount: 0,
          totalCount: 0,
          lastNormalTime: 0,
          lastStoryTime: 0
        }
      };
    }
  }

  // 获取模式切换上下文
  async getModeTransitionContext(
    chatId: string, 
    fromMode: 'normal' | 'story', 
    toMode: 'normal' | 'story'
  ): Promise<{
    transitionType: string;
    contextMessages: Message[];
    relationshipContext: string;
    emotionalState: string;
    recentTopics: string[];
  }> {
    try {
      const { allMessages, memoryStats } = await this.getCompleteChatMemory(chatId);
      
      // 获取最近的上下文消息（最近10条）
      const contextMessages = allMessages
        .slice(-10)
        .filter(msg => msg.role === 'user' || msg.role === 'assistant');
      
      // 分析关系上下文
      const relationshipContext = this.analyzeRelationshipContext(contextMessages);
      
      // 分析情感状态
      const emotionalState = this.analyzeEmotionalState(contextMessages);
      
      // 提取最近话题
      const recentTopics = this.extractRecentTopics(contextMessages);
      
      // 生成转换类型描述
      const transitionType = this.generateTransitionType(fromMode, toMode, memoryStats);
      
      return {
        transitionType,
        contextMessages,
        relationshipContext,
        emotionalState,
        recentTopics
      };
    } catch (error) {
      console.error('Failed to get mode transition context:', error);
      return {
        transitionType: '首次对话',
        contextMessages: [],
        relationshipContext: '初次见面',
        emotionalState: '中性',
        recentTopics: []
      };
    }
  }

  // 分析关系上下文
  private analyzeRelationshipContext(messages: Message[]): string {
    if (messages.length === 0) return '初次见面';
    
    // 分析消息中的关系线索
    const relationshipKeywords = {
      '亲密': ['喜欢', '爱', '亲', '抱', '吻', '宝贝', '亲爱的'],
      '友好': ['朋友', '伙伴', '一起', '合作', '帮助'],
      '正式': ['您好', '请', '谢谢', '抱歉', '打扰'],
      '熟悉': ['你', '我', '我们', '记得', '之前']
    };
    
    const relationshipScore = {
      '亲密': 0,
      '友好': 0,
      '正式': 0,
      '熟悉': 0
    };
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      Object.entries(relationshipKeywords).forEach(([type, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            relationshipScore[type as keyof typeof relationshipScore]++;
          }
        });
      });
    });
    
    // 确定主要关系类型
    const maxScore = Math.max(...Object.values(relationshipScore));
    if (maxScore === 0) return '初次见面';
    
    const primaryRelationship = Object.entries(relationshipScore)
      .find(([, score]) => score === maxScore)?.[0] || '熟悉';
    
    return primaryRelationship;
  }

  // 分析情感状态
  private analyzeEmotionalState(messages: Message[]): string {
    if (messages.length === 0) return '中性';
    
    const emotionKeywords = {
      '开心': ['😊', '😄', '😆', '哈哈', '开心', '高兴', '快乐', '棒', '好'],
      '生气': ['😠', '😡', '生气', '愤怒', '讨厌', '烦', '不好'],
      '伤心': ['😢', '😭', '伤心', '难过', '哭', '悲伤', '失望'],
      '紧张': ['😰', '😨', '紧张', '担心', '害怕', '焦虑'],
      '平静': ['😐', '平静', '一般', '还行', '正常']
    };
    
    const emotionScore = {
      '开心': 0,
      '生气': 0,
      '伤心': 0,
      '紧张': 0,
      '平静': 0
    };
    
    messages.forEach(msg => {
      const content = msg.content.toLowerCase();
      Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            emotionScore[emotion as keyof typeof emotionScore]++;
          }
        });
      });
    });
    
    // 确定主要情感状态
    const maxScore = Math.max(...Object.values(emotionScore));
    if (maxScore === 0) return '中性';
    
    const primaryEmotion = Object.entries(emotionScore)
      .find(([, score]) => score === maxScore)?.[0] || '平静';
    
    return primaryEmotion;
  }

  // 提取最近话题
  private extractRecentTopics(messages: Message[]): string[] {
    if (messages.length === 0) return [];
    
    const topics: string[] = [];
    const recentContent = messages
      .slice(-5)
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase();
    
    // 简单的话题提取（可以根据需要扩展）
    const topicPatterns = [
      /工作|上班|职业|事业/g,
      /学习|考试|作业|课程/g,
      /游戏|娱乐|电影|音乐/g,
      /食物|吃饭|美食|餐厅/g,
      /旅行|旅游|景点|度假/g,
      /家庭|家人|父母|孩子/g,
      /朋友|聚会|社交/g,
      /健康|运动|锻炼/g
    ];
    
    topicPatterns.forEach(pattern => {
      const matches = recentContent.match(pattern);
      if (matches) {
        const topic = matches[0];
        if (!topics.includes(topic)) {
          topics.push(topic);
        }
      }
    });
    
    return topics.slice(0, 3); // 最多返回3个话题
  }

  // 生成转换类型描述
  private generateTransitionType(
    fromMode: 'normal' | 'story', 
    toMode: 'normal' | 'story',
    memoryStats: {
      normalCount: number;
      storyCount: number;
      totalCount: number;
      lastNormalTime: number;
      lastStoryTime: number;
    }
  ): string {
    if (fromMode === toMode) {
      return '继续当前模式';
    }
    
    if (memoryStats.totalCount === 0) {
      return '首次对话';
    }
    
    if (fromMode === 'normal' && toMode === 'story') {
      return '从线上聊天切换到线下剧情';
    }
    
    if (fromMode === 'story' && toMode === 'normal') {
      return '从线下剧情切换到线上聊天';
    }
    
    return '模式切换';
  }

  // 同步记忆到AI上下文
  async syncMemoryToContext(chatId: string, targetMode: 'normal' | 'story'): Promise<{
    memoryContext: string;
    relationshipInfo: string;
    emotionalContext: string;
    recentHistory: string;
  }> {
    try {
      const { allMessages } = await this.getCompleteChatMemory(chatId);
      
      if (allMessages.length === 0) {
        return {
          memoryContext: '这是首次对话',
          relationshipInfo: '初次见面',
          emotionalContext: '中性',
          recentHistory: ''
        };
      }
      
      // 生成记忆上下文
      const memoryContext = this.generateMemoryContext(allMessages, targetMode);
      
      // 生成关系信息
      const relationshipInfo = this.generateRelationshipInfo(allMessages);
      
      // 生成情感上下文
      const emotionalContext = this.generateEmotionalContext(allMessages);
      
      // 生成最近历史
      const recentHistory = this.generateRecentHistory(allMessages.slice(-5));
      
      return {
        memoryContext,
        relationshipInfo,
        emotionalContext,
        recentHistory
      };
    } catch (error) {
      console.error('Failed to sync memory to context:', error);
      return {
        memoryContext: '记忆同步失败',
        relationshipInfo: '未知关系',
        emotionalContext: '未知情感',
        recentHistory: ''
      };
    }
  }

  // 生成记忆上下文
  private generateMemoryContext(messages: Message[], targetMode: 'normal' | 'story'): string {
    const totalMessages = messages.length;
    const normalMessages = messages.filter(msg => !msg.id.includes('_story_'));
    const storyMessages = messages.filter(msg => msg.id.includes('_story_'));
    
    const context = `总共有${totalMessages}条互动记录，其中聊天模式${normalMessages.length}条，剧情模式${storyMessages.length}条。`;
    
    if (targetMode === 'story') {
      return context + ' 现在切换到剧情模式，请记住之前的聊天内容，在剧情中体现这些关系发展。';
    } else {
      return context + ' 现在切换到聊天模式，请记住之前的剧情发展，在聊天中体现这些关系变化。';
    }
  }

  // 生成关系信息
  private generateRelationshipInfo(messages: Message[]): string {
    const relationshipContext = this.analyzeRelationshipContext(messages);
    const recentTopics = this.extractRecentTopics(messages);
    
    let info = `当前关系状态：${relationshipContext}`;
    
    if (recentTopics.length > 0) {
      info += `，最近讨论的话题：${recentTopics.join('、')}`;
    }
    
    return info;
  }

  // 生成情感上下文
  private generateEmotionalContext(messages: Message[]): string {
    const emotionalState = this.analyzeEmotionalState(messages);
    return `当前情感状态：${emotionalState}`;
  }

  // 生成最近历史
  private generateRecentHistory(messages: Message[]): string {
    if (messages.length === 0) return '';
    
    const formattedMessages = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const sender = msg.role === 'user' ? '用户' : (msg.senderName || 'AI');
      return `[${time}] ${sender}: ${msg.content}`;
    }).join('\n');
    
    return `最近${messages.length}条对话：\n${formattedMessages}`;
  }
}

