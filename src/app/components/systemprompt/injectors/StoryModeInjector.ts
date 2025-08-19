import { PromptInjector, PromptContext } from '../types';

export class StoryModeInjector implements PromptInjector {
  priority = 5; // 剧情模式注入优先级很高，在基础模板之前

  async inject(context: PromptContext): Promise<string> {
    console.log('StoryModeInjector: 开始注入剧情模式专用内容', {
      chatId: context.chat.id,
      chatName: context.chat.name
    });

    // 构建剧情模式专用内容
    const storyModeContent = this.buildStoryModeContent(context);
    
    console.log('StoryModeInjector: 成功注入剧情模式内容');
    
    return storyModeContent;
  }

  // 构建剧情模式专用内容
  private buildStoryModeContent(context: PromptContext): string {
    let content = `\n\n# 剧情模式专用设定`;

    // 添加故事发展目标
    content += this.buildStoryDevelopmentGoals();
    
    // 添加角色关系网络
    content += this.buildCharacterRelationships(context);
    
    // 添加情节推进要求
    content += this.buildPlotProgressionRequirements();
    
    // 添加叙述技巧指导
    content += this.buildNarrativeTechniques();

    return content;
  }

  // 构建故事发展目标
  private buildStoryDevelopmentGoals(): string {
    return `

## 故事发展目标
- **情节推进**: 每次回复都要推进故事情节，避免原地踏步
- **角色深化**: 通过对话和行动展现角色的深层性格
- **冲突发展**: 合理引入和解决故事冲突，保持张力
- **情感发展**: 展现角色之间的情感变化和关系发展
- **世界观扩展**: 在故事中自然地展现世界观设定`;
  }

  // 构建角色关系网络
  private buildCharacterRelationships(context: PromptContext): string {
    const { myNickname } = context;
    
    let content = `

## 角色关系网络
- **主角**: ${context.chat.name} (你扮演的角色)
- **用户角色**: ${myNickname} (故事中的另一个重要角色)
- **关系基础**: 你们之间的关系是故事的核心驱动力`;

    // 如果有群聊记忆，添加其他角色关系
    if (context.chat.settings.linkedGroupChatIds && context.chat.settings.linkedGroupChatIds.length > 0) {
      content += `
- **其他角色**: 故事中可能出现的其他角色，基于群聊记忆构建`;
    }

    return content;
  }

  // 构建情节推进要求
  private buildPlotProgressionRequirements(): string {
    return `

## 情节推进要求
- **每次回复**: 必须推进故事情节，不能只是日常对话
- **冲突引入**: 适时引入新的冲突或挑战
- **悬念设置**: 合理设置悬念，保持读者兴趣
- **高潮准备**: 为故事高潮做铺垫
- **结局导向**: 朝着有意义的故事结局发展`;
  }

  // 构建叙述技巧指导
  private buildNarrativeTechniques(): string {
    return `

## 叙述技巧指导
- **多角度叙述**: 根据需要切换叙述视角
- **细节描写**: 注重环境、动作、心理的细节描写
- **对话运用**: 通过对话推进情节和展现性格
- **内心独白**: 适当展现角色的内心世界
- **环境烘托**: 用环境描写烘托情节氛围
- **节奏控制**: 控制故事节奏，张弛有度`;
  }
}
