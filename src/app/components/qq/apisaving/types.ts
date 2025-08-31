export interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
}

export interface SavedApiConfig extends ApiConfig {
  id: string;
  name: string;
  createdAt: number;
  isDefault?: boolean;
}

export interface ApiConfigManager {
  saveConfig(config: Omit<SavedApiConfig, 'id' | 'createdAt'>): Promise<void>;
  getAllConfigs(): Promise<SavedApiConfig[]>;
  getConfig(id: string): Promise<SavedApiConfig | null>;
  deleteConfig(id: string): Promise<void>;
  setDefaultConfig(id: string): Promise<void>;
  getDefaultConfig(): Promise<SavedApiConfig | null>;
}
