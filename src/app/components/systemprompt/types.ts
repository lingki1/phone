import { ChatItem } from '../../types/chat';

// 提示词注入器接口
export interface PromptInjector {
  inject(context: PromptContext): Promise<string>;
  priority: number; // 注入优先级，数字越小优先级越高
}

// 提示词上下文
export interface PromptContext {
  chat: ChatItem;
  currentTime: string;
  myNickname: string;
  myPersona: string;
  allChats?: ChatItem[];
  availableContacts: ChatItem[];
  chatStatus?: ChatStatus;
  currentPreset?: PresetConfig;
  dbPersonalSettings?: PersonalSettings;
  personalSettings?: PersonalSettings;
  isStoryMode?: boolean; // 新增：标识是否是剧情模式
}

// 聊天状态
export interface ChatStatus {
  isOnline: boolean;
  mood: string;
  location: string;
  outfit: string;
  lastUpdate: number;
}

// 预设配置
export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK?: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences?: string[];
  logitBias?: Record<string, number>;
  responseFormat?: 'text' | 'json_object';
  seed?: number;
  user?: string;
}

// 个人信息
export interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

// 提示词构建结果
export interface PromptBuildResult {
  systemPrompt: string;
  messagesPayload: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  apiParams: Record<string, unknown>;
}

// 记忆信息
export interface MemoryInfo {
  type: 'single' | 'group';
  title: string;
  content: string;
  count: number;
}

// 世界书信息
export interface WorldBookInfo {
  id: string;
  name: string;
  content: string;
  category: string;
  description?: string;
}

// 注入器配置
export interface InjectorConfig {
  enabled: boolean;
  priority: number;
  options?: Record<string, unknown>;
}

// 提示词模板类型
export type PromptTemplateType = 'group' | 'single' | 'base';

// 操作指令类型
export interface ActionInstruction {
  type: string;
  description: string;
  example: string;
  required?: boolean;
}

// 红包处理规则
export interface RedPacketRule {
  condition: string;
  action: string;
  example: string;
}

// 物品信息
export interface ItemInfo {
  id: string;
  name: string;
  description: string;
  quantity: number;
  receivedAt: number;
  fromUser: string;
  shippingMethod: 'instant' | 'fast' | 'slow';
}

// 物品管理信息
export interface ItemInventoryInfo {
  totalItems: number;
  items: ItemInfo[];
  lastUpdated: number;
}
