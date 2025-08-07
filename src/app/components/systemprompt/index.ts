// 主入口文件 - 提示词注入系统
export { PromptManager } from './core/PromptManager';
export { GroupChatTemplate } from './templates/GroupChatTemplate';
export { SingleChatTemplate } from './templates/SingleChatTemplate';
export { BaseTemplate } from './templates/BaseTemplate';

// 注入器
export { WorldBookInjector } from './injectors/WorldBookInjector';
export { MemoryInjector } from './injectors/MemoryInjector';
export { StatusInjector } from './injectors/StatusInjector';
export { PresetInjector } from './injectors/PresetInjector';

// 类型定义
export type {
  PromptContext,
  PromptBuildResult,
  PromptInjector,
  ChatStatus,
  PresetConfig,
  PersonalSettings,
  MemoryInfo,
  WorldBookInfo,
  InjectorConfig,
  PromptTemplateType,
  ActionInstruction,
  RedPacketRule
} from './types';

// 创建默认的提示词管理器实例
import { PromptManager } from './core/PromptManager';
import type { PromptContext, PromptBuildResult } from './types';

// 单例模式，确保全局只有一个提示词管理器实例
let promptManagerInstance: PromptManager | null = null;

export function getPromptManager(): PromptManager {
  if (!promptManagerInstance) {
    promptManagerInstance = new PromptManager();
  }
  return promptManagerInstance;
}

// 便捷的构建提示词函数
export async function buildSystemPrompt(context: PromptContext): Promise<PromptBuildResult> {
  const manager = getPromptManager();
  return await manager.buildPrompt(context);
}

// 便捷的验证提示词函数
export function validateSystemPrompt(systemPrompt: string) {
  const manager = getPromptManager();
  return manager.validatePrompt(systemPrompt);
}
