import { PromptInjector, PromptContext } from '../types';
import type { ChatStatus } from '../../qq/chatstatus';

export class CharacterStateInjector implements PromptInjector {
  priority = 25; // 角色状态注入优先级较高

  async inject(context: PromptContext): Promise<string> {
    const { chat, chatStatus } = context;
    
    console.log('CharacterStateInjector: 开始注入角色状态内容', {
      chatId: chat.id,
      hasChatStatus: !!chatStatus
    });

    const characterStateContent = this.buildCharacterStateContent(context);
    
    console.log('CharacterStateInjector: 成功注入角色状态内容');
    
    return characterStateContent;
  }

  // 构建角色状态内容
  private buildCharacterStateContent(context: PromptContext): string {
    const { chatStatus } = context;
    
    let content = `\n\n# 角色状态描写指导`;

    // 添加基础状态信息
    content += this.buildBasicStateInfo(chatStatus);
    
    // 添加心理状态描写
    content += this.buildPsychologicalStateGuidance();
    
    // 添加情感变化描写
    content += this.buildEmotionalChangeGuidance();
    
    // 添加状态更新要求
    content += this.buildStateUpdateRequirements(chatStatus);

    return content;
  }

  // 构建基础状态信息
  private buildBasicStateInfo(chatStatus: ChatStatus | undefined): string {
    if (!chatStatus) {
      return `

## 基础状态信息
- **角色状态**: 根据故事发展自然变化
- **心理状态**: 根据情节需要展现内心世界
- **情感状态**: 根据故事发展展现情感变化`;
    }

    return `

## 基础状态信息
- **在线状态**: ${chatStatus.isOnline ? '在线' : '离线'}
- **当前心情**: ${chatStatus.mood}
- **当前位置**: ${chatStatus.location}
- **当前穿着**: ${chatStatus.outfit}
- **最后更新**: ${new Date(chatStatus.lastUpdate).toLocaleString('zh-CN')}

请根据以上状态信息，在故事中自然地展现角色的状态变化。`;
  }

  // 构建心理状态描写指导
  private buildPsychologicalStateGuidance(): string {
    return `

## 心理状态描写指导
- **内心独白**: 适当展现角色的内心想法和感受
- **心理活动**: 描写角色的思考过程和情感变化
- **潜意识展现**: 通过细节暗示角色的潜意识状态
- **心理冲突**: 展现角色内心的矛盾和挣扎
- **心理成长**: 通过故事展现角色的心理成长

### 心理描写技巧
- **直接描写**: 直接描述角色的心理状态
- **间接暗示**: 通过行为、语言间接展现心理
- **环境烘托**: 用环境描写烘托心理状态
- **对比手法**: 用对比突出心理变化
- **细节刻画**: 通过细节展现心理状态`;
  }

  // 构建情感变化描写指导
  private buildEmotionalChangeGuidance(): string {
    return `

## 情感变化描写指导
- **情感层次**: 展现复杂的情感层次和变化
- **情感递进**: 情感变化要有逻辑性和递进性
- **情感冲突**: 展现不同情感之间的冲突
- **情感共鸣**: 让读者能够产生情感共鸣
- **情感真实**: 情感描写要真实、自然

### 情感表达方式
- **语言表达**: 通过对话表达情感
- **行为表达**: 通过行动展现情感
- **心理表达**: 通过内心描写展现情感
- **环境表达**: 通过环境烘托情感
- **细节表达**: 通过细节暗示情感`;
  }

  // 构建状态更新要求
  private buildStateUpdateRequirements(chatStatus: ChatStatus | undefined): string {
    const now = Date.now();
    const lastUpdate = chatStatus?.lastUpdate || 0;
    const timeDiff = now - lastUpdate;
    const shouldUpdate = timeDiff > 30 * 60 * 1000; // 30分钟

    let content = `

## 状态更新要求`;

    if (shouldUpdate) {
      content += `
- **需要更新**: 由于距离上次状态更新已经较长时间，请在故事中自然地更新角色状态
- **更新方式**: 将状态更新融入故事叙述中，不要突兀
- **更新内容**: 包括心情、位置、穿着等状态信息
- **更新时机**: 在合适的情节节点进行状态更新`;
    } else {
      content += `
- **状态稳定**: 当前状态较为稳定，可以继续使用现有状态
- **自然变化**: 在故事发展中自然地展现状态变化
- **保持一致**: 确保状态变化符合故事逻辑和角色性格`;
    }

    content += `

### 状态更新技巧
- **融入叙述**: 将状态更新自然地融入故事叙述
- **符合逻辑**: 状态变化要符合故事发展逻辑
- **展现性格**: 通过状态变化展现角色性格特点
- **推进情节**: 状态变化要能够推进故事情节
- **增强真实感**: 状态变化要增强故事的真实感`;

    return content;
  }
}
