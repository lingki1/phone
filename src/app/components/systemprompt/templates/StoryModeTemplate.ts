import { BaseTemplate } from './BaseTemplate';

export class StoryModeTemplate extends BaseTemplate {
  build(): string {
    const { chat, myPersona } = this.context;
    
    // 获取剧情模式专用的规则
    const storyRules = this.getStoryModeRules();
    
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
  private getStoryModeRules(): string[] {
    return [
      '剧情推展: 专注于推进故事情节，让故事不断发展',
      '角色发展: 深化角色性格，展现角色成长和变化',
      '叙述风格: 采用小说风格的叙述方式，注重描写和细节',
      '沉浸体验: 创造引人入胜的阅读体验',
      '状态描写: 自然地融入角色状态变化，让故事更真实'
    ];
  }

  // 获取叙述风格规则
  private getNarrativeStyleRules(): string[] {
    return [
      '对话模式: 使用引号标记对话，注重对话的真实性和角色特色',
      '叙述模式: 采用第三人称叙述，注重环境描写和情节推进',
      '状态模式: 深入角色内心，描写心理活动和情感变化',
      '动作模式: 生动描述角色动作，增强画面感',
      '环境描写: 注重场景氛围营造，增强沉浸感'
    ];
  }

  // 获取显示模式规则
  private getDisplayModeRules(): string[] {
    return [
      '支持多种显示模式: 对话、叙述、状态、动作等',
      '根据情节需要选择合适的叙述方式',
      '注重环境描写和氛围营造',
      '展现角色的内心世界和情感变化',
      '保持叙述的流畅性和连贯性'
    ];
  }
}
