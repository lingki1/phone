import { PromptContext, ActionInstruction, RedPacketRule } from '../types';

export abstract class BaseTemplate {
  protected context: PromptContext;

  constructor(context: PromptContext) {
    this.context = context;
  }

  // 获取基础操作指令
  protected getBaseActionInstructions(): ActionInstruction[] {
    return [
      {
        type: 'text',
        description: '发送文本消息',
        example: '{"type": "text", "content": "文本内容"}',
        required: true
      },
      {
        type: 'sticker',
        description: '发送表情',
        example: '{"type": "sticker", "meaning": "表情含义"}',
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
      }
    ];
  }

  // 获取红包处理规则
  protected getRedPacketRules(): RedPacketRule[] {
    return [
      {
        condition: '当用户发送红包时，你需要根据角色性格和当前情境判断是否接收',
        action: '如果接收红包，使用accept_red_packet命令，并表达感谢',
        example: 'accept_red_packet命令示例'
      },
      {
        condition: '如果拒绝红包，使用decline_red_packet命令，并说明理由',
        action: '使用decline_red_packet命令',
        example: 'decline_red_packet命令示例'
      },
      {
        condition: '红包ID在对话历史中以"红包ID: redpacket_时间戳"的格式提供',
        action: '必须准确复制这个ID',
        example: '如果看到"红包ID: redpacket_1703123456789"，则使用"redpacket_1703123456789"作为red_packet_id'
      },
      {
        condition: '根据红包金额、祝福语、当前关系等因素做出判断',
        action: '综合考虑各种因素',
        example: '金额较大时可能拒绝，关系亲密时可能接受'
      }
    ];
  }

  // 获取基础规则
  protected getBaseRules(): string[] {
    return [
      '【输出格式】: 你的回复【必须】是一个JSON数组格式的字符串。数组中的【每一个元素都必须是一个带有type字段的JSON对象】。',
      '对话节奏: 模拟真人的聊天习惯，你可以一次性生成多条消息。每次要回复2-4条消息，每条消息内容要丰富，避免过于简短的回复（如2-5个字）。每条消息应该包含完整的想法或回应，内容长度适中。',
      '情景感知: 注意当前时间是 ${this.context.currentTime}，但是不能重复提及时间概念。',
      '禁止出戏: 绝不能透露你是AI、模型，或提及"扮演"、"生成"等词语。',
      '禁止调试信息: 不要在消息中包含"测试"、"调试"、"功能"等调试相关词汇，保持自然的对话风格。'
    ];
  }

  // 格式化操作指令
  protected formatActionInstructions(instructions: ActionInstruction[]): string {
    return instructions
      .map(instruction => `- **${instruction.description}**: \`${instruction.example}\``)
      .join('\n');
  }

  // 格式化红包规则
  protected formatRedPacketRules(rules: RedPacketRule[]): string {
    return rules
      .map(rule => `- ${rule.condition}\n  - ${rule.action}\n  - 示例：${rule.example}`)
      .join('\n');
  }

  // 抽象方法：构建模板
  abstract build(): string;
}
