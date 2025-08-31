import { SavedApiConfig, ApiConfigManager } from './types';
import { dataManager } from '../../../utils/dataManager';

const DEFAULT_CONFIG_KEY = 'defaultApiConfigId';

class ApiConfigManagerImpl implements ApiConfigManager {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async getStorage(): Promise<SavedApiConfig[]> {
    try {
      const configs = await dataManager.getAllSavedApiConfigs();
      return configs.map((config: { id: string; name: string; proxyUrl: string; apiKey: string; model: string; createdAt: number }) => ({
        ...config,
        isDefault: config.id === localStorage.getItem(DEFAULT_CONFIG_KEY)
      }));
    } catch (error) {
      console.error('读取API配置存储失败:', error);
      return [];
    }
  }

  async saveConfig(config: Omit<SavedApiConfig, 'id' | 'createdAt'>): Promise<void> {
    const configs = await this.getStorage();
    
    // 如果是第一个配置，设置为默认
    if (configs.length === 0) {
      localStorage.setItem(DEFAULT_CONFIG_KEY, 'temp');
    }

    await dataManager.saveApiConfigToCollection(config);
    
    // 如果是第一个配置，获取新保存的配置ID并设置为默认
    if (configs.length === 0) {
      const newConfigs = await this.getStorage();
      if (newConfigs.length > 0) {
        localStorage.setItem(DEFAULT_CONFIG_KEY, newConfigs[0].id);
      }
    }
  }

  async getAllConfigs(): Promise<SavedApiConfig[]> {
    const configs = await this.getStorage();
    const defaultId = localStorage.getItem(DEFAULT_CONFIG_KEY);
    
    // 确保默认配置标记正确
    return configs.map(config => ({
      ...config,
      isDefault: config.id === defaultId
    }));
  }

  async getConfig(id: string): Promise<SavedApiConfig | null> {
    const configs = await this.getStorage();
    const config = configs.find(c => c.id === id);
    if (!config) return null;

    const defaultId = localStorage.getItem(DEFAULT_CONFIG_KEY);
    return {
      ...config,
      isDefault: config.id === defaultId
    };
  }

  async deleteConfig(id: string): Promise<void> {
    const configs = await this.getStorage();
    const configExists = configs.some(c => c.id === id);
    
    if (!configExists) {
      throw new Error('配置不存在');
    }

    // 如果删除的是默认配置，设置第一个为默认
    const defaultId = localStorage.getItem(DEFAULT_CONFIG_KEY);
    if (defaultId === id && configs.length > 1) {
      const remainingConfigs = configs.filter(c => c.id !== id);
      if (remainingConfigs.length > 0) {
        localStorage.setItem(DEFAULT_CONFIG_KEY, remainingConfigs[0].id);
      }
    }

    await dataManager.deleteSavedApiConfig(id);
  }

  async setDefaultConfig(id: string): Promise<void> {
    const configs = await this.getStorage();
    const config = configs.find(c => c.id === id);
    
    if (!config) {
      throw new Error('配置不存在');
    }

    localStorage.setItem(DEFAULT_CONFIG_KEY, id);
  }

  async getDefaultConfig(): Promise<SavedApiConfig | null> {
    const defaultId = localStorage.getItem(DEFAULT_CONFIG_KEY);
    if (!defaultId) return null;

    return await this.getConfig(defaultId);
  }
}

// 导出单例实例
export const apiConfigManager = new ApiConfigManagerImpl();
