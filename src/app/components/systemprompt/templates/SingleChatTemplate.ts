import { BaseTemplate } from './BaseTemplate';
import { ActionInstruction } from '../types';

export class SingleChatTemplate extends BaseTemplate {
  build(): string {
    const { chat, myPersona } = this.context;
    
    // 构建群聊记忆信息
    const groupMemoryInfo = this.buildGroupMemoryInfo();
    
    // 获取单聊专用的操作指令
    const singleActionInstructions = this.getSingleActionInstructions();
    
    // 获取基础规则
    const baseRules = this.getBaseRules();
    
    // 获取情境感知规则
    const situationalRules = this.getSituationalAwarenessRules();
    
    // 获取防出戏规则
    const antiBreakingRules = this.getAntiBreakingRules();
    
    // 获取现实逻辑规则
    const realityLogicRules = this.getRealityLogicRules();
    
    // 添加单聊特有规则
    const singleRules = [
      ...baseRules,
      '群聊记忆: 你拥有在群聊中与用户的互动记忆，在单聊中要体现这些记忆和关系。请参考下方的"群聊记忆信息"部分，了解你在群聊中的表现和与用户的关系。',
      '状态实时性: 每次对话都应该根据当前时间、对话内容和情境实时更新你的状态，让对话更有真实感。'
    ];

    return `你现在扮演一个名为"${chat.name}"的角色。

# 你的角色设定：
${chat.settings.aiPersona}

# 你的任务与规则：
${singleRules.map((rule, index) => `${index + 1}. **${rule}**`).join('\n')}

# 情境感知规则：
${this.formatSituationalAwarenessRules(situationalRules)}

# 防出戏规则：
${this.formatAntiBreakingRules(antiBreakingRules)}

# 现实逻辑规则：
${this.formatRealityLogicRules(realityLogicRules)}

# 你可以使用的操作指令:
${this.formatActionInstructions(singleActionInstructions)}

# 红包处理规则：
${this.formatRedPacketRules(this.getRedPacketRules())}

# 对话者的角色设定：
${myPersona}${groupMemoryInfo}

现在，请根据以上规则、对话历史和群聊记忆，继续进行对话。`;
  }

  // 构建群聊记忆信息
  private buildGroupMemoryInfo(): string {
    const { chat } = this.context;
    
    if (!chat.settings.linkedGroupChatIds || chat.settings.linkedGroupChatIds.length === 0) {
      return '';
    }

    // 注意：这里需要异步处理，但在模板中我们返回占位符
    // 实际的异步处理将在注入器中完成
    return `

# 群聊记忆信息
[群聊记忆将在注入器中动态添加]`;
  }

  // 获取单聊专用的操作指令
  private getSingleActionInstructions(): ActionInstruction[] {
    return [
      {
        type: 'text',
        description: '发送文本',
        example: '{"type": "text", "content": "文本内容"}',
        required: true
      },
      {
        type: 'sticker',
        description: '发送表情',
        example: '{"type": "sticker", "meaning": "表情含义"} (注意：不允许使用url字段，不能发送链接图片)',
        required: false
      },
      {
        type: 'ai_image',
        description: '发送图片',
        example: '{"type": "ai_image", "description": "图片描述"}',
        required: false
      },
      {
        type: 'voice_message',
        description: '发送语音',
        example: '{"type": "voice_message", "content": "语音内容"}',
        required: false
      },
      {
        type: 'pat_user',
        description: '拍一拍用户',
        example: '{"type": "pat_user", "suffix": "后缀"}',
        required: false
      },
      {
        type: 'send_red_packet',
        description: '发送红包',
        example: '{"type": "send_red_packet", "amount": 金额数字, "message": "祝福语"}',
        required: false
      },
      {
        type: 'request_red_packet',
        description: '请求红包',
        example: '{"type": "request_red_packet", "message": "请求消息"}',
        required: false
      },
      {
        type: 'accept_red_packet',
        description: '接收红包',
        example: '{"type": "accept_red_packet", "red_packet_id": "红包ID", "message": "感谢消息"}',
        required: false
      },
      {
        type: 'decline_red_packet',
        description: '拒绝红包',
        example: '{"type": "decline_red_packet", "red_packet_id": "红包ID", "message": "拒绝理由"}',
        required: false
      },
      {
        type: 'status_update',
        description: '更新状态',
        example: '{"type": "status_update", "mood": "新心情", "location": "新位置", "outfit": "新穿着"}',
        required: false
      }
    ];
  }
}
