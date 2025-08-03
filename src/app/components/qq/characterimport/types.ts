// SillyTavern 角色卡片数据结构
export interface SillyTavernCharacter {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes: string;
  tags: string[];
  creator: string;
  character_version: string;
  alternate_greetings: string[];
  extensions?: Record<string, unknown>;
  spec: string;
  spec_version: string;
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes: string;
    tags: string[];
    creator: string;
    character_version: string;
    alternate_greetings: string[];
    extensions?: Record<string, unknown>;
  };
}

// PNG 解析结果
export interface PNGParseResult {
  success: boolean;
  character?: SillyTavernCharacter;
  imageData?: string; // Base64 编码的图片数据
  error?: string;
}

// 角色导入状态
export interface CharacterImportState {
  isImporting: boolean;
  progress: number;
  error?: string;
  preview?: {
    character: SillyTavernCharacter;
    imageData: string;
  };
}

// 导入配置选项
export interface ImportOptions {
  useDefaultPreset: boolean;
  selectedPresetId?: string;
  autoCreateAvatar: boolean;
} 