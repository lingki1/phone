import { PromptInjector, PromptContext } from '../types';

export class StoryModeInjector implements PromptInjector {
  priority = 5; // 剧情模式注入优先级很高，在基础模板之前

  async inject(context: PromptContext): Promise<string> {
    // 只在剧情模式下注入
    if (!context.isStoryMode) {
      return '';
    }

    console.log('StoryModeInjector: 开始注入剧情模式专用内容', {
      chatId: context.chat.id,
      chatName: context.chat.name,
      isStoryMode: context.isStoryMode
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
- **节奏控制**: 控制故事节奏，张弛有度

## 文本装饰格式规范
**重要：在剧情模式中，必须严格按照以下格式输出文本装饰：**

### 装饰格式规则：
1. **角色对话**: 使用 *斜体* 包围，如 *"你好，我是小明"*
2. **重要动作和强调**: 使用 **加粗** 包围，如 **小明猛地站起来**
3. **心理活动**: 使用 (括号) 包围，如 (小明心想：我该怎么办？)
4. **环境描述**: 使用普通文字，无需特殊装饰
5. **声音效果**: 使用 *叮咚* 格式，如 *门铃响了*
6. **时间标记**: 使用 [时间] 格式，如 [第二天早上]

### 装饰使用原则：
- 所有角色直接说话都必须用 *斜体*
- 重要的动作、转折、情感爆发用 **加粗**
- 内心独白、思考过程用 (括号)
- 叙述性描述保持普通文字
- 确保装饰层次分明，增强阅读体验

### 示例格式：
*"你...你真的愿意听我说吗？"* 小明的声音有些颤抖。

**她深吸一口气，努力让自己冷静下来。**

房间里只有时钟滴答的声音，显得格外安静。

*如果我说出来，你会怎么看我呢？* 她心里忐忑不安。

**终于，她下定决心，抬起头直视着对方。**

*"其实，我一直都很害怕..."* 她的声音越来越小。

**这一刻，所有的伪装都崩塌了。**

(小明：也许这就是我一直在等待的机会)

*叮咚* 门铃突然响起。

[第二天早上] 阳光透过窗帘洒进房间。

**注意：必须严格按照以上格式输出，确保文本装饰的正确使用！**`;
  }
}
