// 预设类型定义
export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
  
  // OpenAI 参数配置
  temperature: number;        // 温度 (0-2)
  maxTokens: number;          // 最大令牌数
  topP: number;              // Top P (0-1)
  topK?: number;             // Top K (可选)
  frequencyPenalty: number;  // 频率惩罚 (-2.0 到 2.0)
  presencePenalty: number;   // 存在惩罚 (-2.0 到 2.0)
  stopSequences?: string[];  // 停止序列
  logitBias?: Record<string, number>; // 对数偏差
  
  // 高级参数
  responseFormat?: 'text' | 'json_object'; // 响应格式
  seed?: number;             // 随机种子
  user?: string;             // 用户标识
}

// 预设分类
export interface PresetCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 预设管理状态
export interface PresetState {
  presets: PresetConfig[];
  currentPreset: PresetConfig | null;
  isLoading: boolean;
  error: string | null;
}

// 预设操作类型
export type PresetAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRESETS'; payload: PresetConfig[] }
  | { type: 'ADD_PRESET'; payload: PresetConfig }
  | { type: 'UPDATE_PRESET'; payload: PresetConfig }
  | { type: 'DELETE_PRESET'; payload: string }
  | { type: 'SET_CURRENT_PRESET'; payload: PresetConfig | null };

// 预设验证错误
export interface PresetValidationError {
  field: keyof PresetConfig;
  message: string;
}

// 预设模板
export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: Omit<PresetConfig, 'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'>;
} 