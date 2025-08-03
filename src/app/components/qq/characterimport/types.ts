// SillyTavern 角色卡片类型定义
export interface SillyTavernCharacter {
  // 角色名称 - 支持多种字段名
  name: string;
  title?: string;
  character_name?: string;
  char_name?: string;
  
  // 角色描述
  description: string;
  desc?: string;
  
  // 角色人设
  personality: string;
  char_persona?: string;
  
  // 场景设定
  scenario: string;
  context?: string;
  
  // 首次消息
  first_mes: string;
  greeting?: string;
  
  // 示例对话
  mes_example: string;
  example_dialogue?: string;
  
  // 创建者备注
  creator_notes: string;
  notes?: string;
  
  // 标签
  tags: string[];
  
  // 创建者
  creator: string;
  author?: string;
  
  // 版本
  character_version: string;
  version?: string;
  
  // 替代问候语
  alternate_greetings: string[];
  greetings?: string[];
  
  // 历史指令
  post_history_instructions: string;
  post_history?: string;
  
  // 世界设定
  world_scenario: string;
  world?: string;
  
  // 角色书
  character_book: string;
  book?: string;
  
  // 扩展数据
  extensions: Record<string, unknown>;
}

// SillyTavern v2 格式的包装器
export interface SillyTavernV2Wrapper {
  spec: 'chara_card_v2';
  spec_version: string;
  data: SillyTavernCharacter;
}

// 解析结果类型
export interface CharacterParseResult {
  success: boolean;
  character?: SillyTavernCharacter;
  imageData?: string; // Base64 图像数据
  error?: string;
}

// 导入配置类型
export interface ImportConfig {
  useCharacterName: boolean;
  useCharacterPersonality: boolean;
  useCharacterDescription: boolean;
  useCharacterImage: boolean;
  selectedPreset?: string;
}

// 预览角色类型
export interface PreviewCharacter {
  name: string;
  avatar: string;
  persona: string;
  description: string;
  originalData: SillyTavernCharacter;
} 