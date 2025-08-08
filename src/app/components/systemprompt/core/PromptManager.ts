import { 
  PromptContext, 
  PromptBuildResult, 
  PromptInjector
} from '../types';
import { GroupChatTemplate } from '../templates/GroupChatTemplate';
import { SingleChatTemplate } from '../templates/SingleChatTemplate';
import { WorldBookInjector } from '../injectors/WorldBookInjector';
import { MemoryInjector } from '../injectors/MemoryInjector';
import { StatusInjector } from '../injectors/StatusInjector';
import { PresetInjector } from '../injectors/PresetInjector';
import { ItemInjector } from '../injectors/ItemInjector';

export class PromptManager {
  private injectors: PromptInjector[] = [];
  private presetInjector: PresetInjector;

  constructor() {
    // 初始化默认注入器
    this.presetInjector = new PresetInjector();
    this.injectors = [
      this.presetInjector,
      new WorldBookInjector(),
      new MemoryInjector(),
      new StatusInjector(),
      new ItemInjector()
    ];
  }

  // 添加自定义注入器
  addInjector(injector: PromptInjector): void {
    this.injectors.push(injector);
    // 按优先级排序
    this.injectors.sort((a, b) => a.priority - b.priority);
  }

  // 移除注入器
  removeInjector(injectorType: string): void {
    this.injectors = this.injectors.filter(injector => 
      injector.constructor.name !== injectorType
    );
  }

  // 构建完整的提示词
  async buildPrompt(context: PromptContext): Promise<PromptBuildResult> {
    console.log('PromptManager: 开始构建提示词', {
      chatId: context.chat.id,
      isGroup: context.chat.isGroup,
      hasPreset: !!context.currentPreset,
      hasWorldBooks: !!(context.chat.settings.linkedWorldBookIds?.length),
      hasMemory: !!(context.chat.settings.linkedGroupChatIds?.length)
    });

    // 1. 构建基础模板
    const baseTemplate = this.buildBaseTemplate(context);
    let systemPrompt = baseTemplate.build();

    // 2. 按优先级执行所有注入器
    for (const injector of this.injectors) {
      try {
        const injectedContent = await injector.inject(context);
        if (injectedContent) {
          systemPrompt += injectedContent;
          console.log(`PromptManager: ${injector.constructor.name} 注入成功`);
        }
      } catch (error) {
        console.error(`PromptManager: ${injector.constructor.name} 注入失败:`, error);
      }
    }

    // 3. 构建消息载荷
    const messagesPayload = this.buildMessagesPayload(context);

    // 4. 获取API参数
    const apiParams = this.getApiParams(context);

    console.log('PromptManager: 提示词构建完成', {
      systemPromptLength: systemPrompt.length,
      messagesCount: messagesPayload.length,
      hasApiParams: Object.keys(apiParams).length > 0
    });

    return {
      systemPrompt,
      messagesPayload,
      apiParams
    };
  }

  // 构建基础模板
  private buildBaseTemplate(context: PromptContext) {
    if (context.chat.isGroup) {
      return new GroupChatTemplate(context);
    } else {
      return new SingleChatTemplate(context);
    }
  }

  // 构建消息载荷
  private buildMessagesPayload(context: PromptContext) {
    const { chat, myNickname } = context;
    
    // 从全局设置获取最大记忆数量
    const globalSettings = localStorage.getItem('globalSettings');
    const maxMemory = globalSettings ? JSON.parse(globalSettings).maxMemory || 20 : 20;
    const historySlice = chat.messages.slice(-maxMemory);

    return historySlice.map(msg => {
      const sender = msg.role === 'user' ? myNickname : msg.senderName;
      const prefix = `${sender} (Timestamp: ${msg.timestamp}): `;
      
      let content;
      if (msg.type === 'ai_image') {
        content = `[${sender} 发送了一张图片]`;
      } else if (msg.type === 'voice_message') {
        content = `[${sender} 发送了一条语音，内容是：'${msg.content}']`;
      } else if (msg.meaning) {
        content = `${sender}: [发送了一个表情，意思是: '${msg.meaning}']`;
      } else if (msg.type === 'red_packet_send' && msg.redPacketData) {
        // 红包发送消息，包含红包ID和详细信息
        const redPacket = msg.redPacketData;
        let status = '待处理';
        if (redPacket.status === 'accepted') {
          status = '已接收';
        } else if (redPacket.status === 'rejected') {
          status = '已拒绝';
        } else if (redPacket.isClaimed) {
          status = '已被领取';
        }
        content = `${prefix}发送了一个红包 [红包ID: ${redPacket.id}, 金额: ¥${redPacket.amount}, 祝福语: "${redPacket.message}", 状态: ${status}]`;
      } else if (msg.type === 'red_packet_receive' && msg.redPacketData) {
        // AI发送给用户的红包
        content = `${prefix}${msg.content} [金额: ¥${msg.redPacketData.amount}]`;
      } else if (msg.type === 'red_packet_request' && msg.redPacketData) {
        // AI请求红包
        content = `${prefix}${msg.content} [${msg.redPacketData.message}]`;
      } else {
        content = `${prefix}${msg.content}`;
      }
      
      return { role: 'user' as const, content };
    }).filter(Boolean);
  }

  // 获取API参数
  private getApiParams(context: PromptContext): Record<string, unknown> {
    if (context.currentPreset) {
      return this.presetInjector.getApiParams(context.currentPreset);
    }

    // 默认参数
    return {
      temperature: 0.8,
      max_tokens: 2000,
      top_p: 0.8,
      frequency_penalty: 0.0,
      presence_penalty: 0.0
    };
  }

  // 获取注入器列表（用于调试）
  getInjectors(): Array<{ name: string; priority: number }> {
    return this.injectors.map(injector => ({
      name: injector.constructor.name,
      priority: injector.priority
    }));
  }

  // 验证提示词
  validatePrompt(systemPrompt: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查基本结构
    if (!systemPrompt.includes('核心规则') && !systemPrompt.includes('任务与规则')) {
      errors.push('缺少核心规则或任务规则');
    }

    if (!systemPrompt.includes('操作指令')) {
      errors.push('缺少操作指令');
    }

    if (!systemPrompt.includes('红包处理规则')) {
      errors.push('缺少红包处理规则');
    }

    // 检查长度
    if (systemPrompt.length < 100) {
      errors.push('提示词过短，可能缺少必要内容');
    }

    if (systemPrompt.length > 10000) {
      errors.push('提示词过长，可能影响性能');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
