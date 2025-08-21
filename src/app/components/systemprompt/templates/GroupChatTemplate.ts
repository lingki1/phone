import { BaseTemplate } from './BaseTemplate';
import { ActionInstruction } from '../types';

export class GroupChatTemplate extends BaseTemplate {
  build(): string {
    const { chat, myNickname, myPersona, isStoryMode } = this.context;
    
    // 构建群成员列表
    const membersList = chat.members?.map(m => `- **${m.originalName}**: ${m.persona}`).join('\n') || '';
    
    // 构建单聊记忆信息
    const memoryInfo = this.buildSingleChatMemoryInfo();
    
    // 获取群聊专用的操作指令
    const groupActionInstructions = this.getGroupActionInstructions();
    
    // 获取基础规则
    const baseRules = this.getBaseRules();
    
    // 获取模式区分规则
    const modeDistinctionRules = this.getModeDistinctionRules();
    
    // 获取情境感知规则
    const situationalRules = this.getSituationalAwarenessRules();
    
    // 获取防出戏规则
    const antiBreakingRules = this.getAntiBreakingRules();
    
    // 获取现实逻辑规则
    const realityLogicRules = this.getRealityLogicRules();
    
    // 根据模式获取特定规则
    const modeSpecificRules = isStoryMode 
      ? this.getStoryModeRules() 
      : this.getChatModeRules();
    
    // 添加群聊特有规则
    const groupRules = [
      ...baseRules,
      `【身份铁律】: 用户的身份是【${myNickname}】。你【绝对、永远、在任何情况下都不能】生成name字段为"${myNickname}"或"${chat.name}"的消息。`,
      '角色扮演: 严格遵守下方"群成员列表及人设"中的每一个角色的设定。',
      '记忆继承: 每个角色都拥有与用户的单聊记忆，在群聊中要体现这些记忆和关系。',
      '群聊互动: 在群聊中，角色之间也要有自然的互动，不仅仅是与用户的对话。',
      '情境协调: 所有角色都要在同一个情境中，保持时间和空间的一致性。'
    ];

    // 构建模式说明
    const modeDescription = isStoryMode 
      ? '【当前模式：剧情模式（线下）】这是一个面对面的群组聚会场景，所有角色都在同一个现实空间中。'
      : '【当前模式：聊天模式（线上）】这是一个网络群聊，所有角色通过手机聊天软件进行交流。';

    return `你是一个群聊AI，负责扮演【除了用户以外】的所有角色。

${modeDescription}

# 核心规则
${groupRules.map((rule, index) => `${index + 1}. **${rule}**`).join('\n')}

# 模式区分规则：
${this.formatModeDistinctionRules(modeDistinctionRules)}

# ${isStoryMode ? '剧情模式' : '聊天模式'}特定规则：
${isStoryMode 
  ? this.formatStoryModeRules(modeSpecificRules)
  : this.formatChatModeRules(modeSpecificRules)
}

# 情境感知规则：
${this.formatSituationalAwarenessRules(situationalRules)}

# 防出戏规则：
${this.formatAntiBreakingRules(antiBreakingRules)}

# 现实逻辑规则：
${this.formatRealityLogicRules(realityLogicRules)}

## 你可以使用的操作指令:
${this.formatActionInstructions(groupActionInstructions)}

# 红包处理规则：
${this.formatRedPacketRules(this.getRedPacketRules())}

# 群成员列表及人设
${membersList}

# 用户的角色
- **${myNickname}**: ${myPersona}

${memoryInfo ? `# 单聊记忆信息
${memoryInfo}` : ''}

现在，请根据以上规则、对话历史和单聊记忆，继续这场${isStoryMode ? '面对面的群组聚会' : '网络群聊'}。每个角色都应该基于与用户的单聊记忆来表现更真实的关系和互动。`;
  }

  // 构建单聊记忆信息
  private buildSingleChatMemoryInfo(): string {
    const { chat, myNickname } = this.context;
    
    if (!chat.members) return '';

    const memoryInfo = chat.members
      .filter(m => m.id !== 'me' && m.singleChatMemory && m.singleChatMemory.length > 0)
      .map(m => {
        const memoryCount = m.singleChatMemory?.length || 0;
        const recentMessages = m.singleChatMemory?.slice(-5).map(msg => 
          `${msg.role === 'user' ? myNickname : m.originalName}: ${msg.content}`
        ).join('\n') || '';
        
        return `## ${m.originalName} 与 ${myNickname} 的单聊记忆 (${memoryCount} 条记录)
最近5条对话：
${recentMessages}`;
      })
      .join('\n\n');

    return memoryInfo;
  }

  // 获取群聊专用的操作指令
  private getGroupActionInstructions(): ActionInstruction[] {
    return [
      {
        type: 'text',
        description: '发送文本',
        example: '{"type": "text", "name": "角色名", "message": "文本内容"}',
        required: true
      },
      {
        type: 'sticker',
        description: '发送表情',
        example: '{"type": "sticker", "name": "角色名", "meaning": "表情含义"} (注意：不允许使用url字段，不能发送链接图片)',
        required: false
      },
      {
        type: 'ai_image',
        description: '发送图片',
        example: '{"type": "ai_image", "name": "角色名", "description": "图片描述"}',
        required: false
      },
      {
        type: 'voice_message',
        description: '发送语音',
        example: '{"type": "voice_message", "name": "角色名", "content": "语音内容"}',
        required: false
      },
      {
        type: 'pat_user',
        description: '拍一拍用户',
        example: '{"type": "pat_user", "name": "角色名", "suffix": "后缀"}',
        required: false
      },
      {
        type: 'send_red_packet',
        description: '发送红包',
        example: '{"type": "send_red_packet", "name": "角色名", "amount": 金额数字, "message": "祝福语"}',
        required: false
      },
      {
        type: 'request_red_packet',
        description: '请求红包',
        example: '{"type": "request_red_packet", "name": "角色名", "message": "请求消息"}',
        required: false
      },
      {
        type: 'accept_red_packet',
        description: '接收红包',
        example: '{"type": "accept_red_packet", "name": "角色名", "red_packet_id": "红包ID", "message": "感谢消息"}',
        required: false
      },
      {
        type: 'decline_red_packet',
        description: '拒绝红包',
        example: '{"type": "decline_red_packet", "name": "角色名", "red_packet_id": "红包ID", "message": "拒绝理由"}',
        required: false
      }
    ];
  }
}
