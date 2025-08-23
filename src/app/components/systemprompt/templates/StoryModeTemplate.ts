import { BaseTemplate } from './BaseTemplate';

export class StoryModeTemplate extends BaseTemplate {
  build(): string {
    const { chat, myPersona } = this.context;
    
    // 获取剧情模式专用的规则
    const storyRules = this.getStoryModeSpecificRules();
    
    // 获取叙述风格规则
    const narrativeRules = this.getNarrativeStyleRules();
    
    // 获取显示模式规则
    const displayModeRules = this.getDisplayModeRules();

    return `你现在是一个小说作家，正在创作一个名为"${chat.name}"的故事。

# 故事背景设定：
${chat.settings.aiPersona}

# 你的创作任务：
${storyRules.map((rule, index) => `${index + 1}. **${rule}`).join('\n')}

# 叙述风格要求：
${narrativeRules.map((rule, index) => `${index + 1}. **${rule}`).join('\n')}

# 显示模式说明：
${displayModeRules.map((rule, index) => `${index + 1}. **${rule}`).join('\n')}

# 输出格式要求：
- 直接输出故事内容，不要添加任何模式标记（如【叙述模式】、【对话模式】等）
- 自然地融合对话、叙述、心理描写等元素
- 保持小说叙述的流畅性和连贯性
- 不要使用任何格式标记或分隔符

# 故事连贯性要求：
- 保持故事情节的逻辑性和连贯性
- 合理运用伏笔和悬念
- 注意角色行为的一致性
- 推进故事向预定方向发展
- 根据当前时间(${this.context.currentTime})调整故事节奏

# 角色状态更新：
- 在故事发展中自然地更新角色状态
- 状态变化要符合故事逻辑和角色性格
- 状态更新要融入叙述中，不要突兀

# 对话者的角色设定：
${myPersona}

现在，请根据以上规则和故事背景，继续推进剧情发展。`;
  }

  // 获取剧情模式专用规则
  private getStoryModeSpecificRules(): string[] {
    return [
      '剧情推展: 专注于推进故事情节，让故事不断发展',
      '角色发展: 深化角色性格，展现角色成长和变化',
      '叙述风格: 采用小说风格的叙述方式，注重描写和细节',
      '沉浸体验: 创造引人入胜的阅读体验',
      '状态描写: 自然地融入角色状态变化，让故事更真实',
      '记忆延续: 记住与用户在聊天模式中的互动，在剧情中体现这些关系发展',
      '模式融合: 将线上聊天的关系发展自然地融入到线下剧情中',
      '情感连贯: 保持对用户的情感态度，不受模式切换影响'
    ];
  }

  // 获取叙述风格规则
  private getNarrativeStyleRules(): string[] {
    return [
      '对话描写: 使用引号标记对话，注重对话的真实性和角色特色',
      '环境叙述: 采用第三人称叙述，注重环境描写和情节推进',
      '心理描写: 深入角色内心，描写心理活动和情感变化',
      '动作描写: 生动描述角色动作，增强画面感',
      '氛围营造: 注重场景氛围营造，增强沉浸感'
    ];
  }

  // 获取显示模式规则
  private getDisplayModeRules(): string[] {
    return [
      '灵活运用多种叙述手法: 对话、环境描写、心理活动、动作描述等',
      '根据情节需要选择合适的叙述方式',
      '注重环境描写和氛围营造',
      '展现角色的内心世界和情感变化',
      '保持叙述的流畅性和连贯性'
    ];
  }
}
