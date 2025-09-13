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
      console.error('Failed to read API configuration storage:', error);
      return [];
    }
  }

  async saveConfig(config: Omit<SavedApiConfig, 'id' | 'createdAt'>): Promise<void> {
    const configs = await this.getStorage();
    
    // If it is the first configuration, set as default
    if (configs.length === 0) {
      localStorage.setItem(DEFAULT_CONFIG_KEY, 'temp');
    }

    await dataManager.saveApiConfigToCollection(config);
    
    // If it is the first configuration, get the newly saved configuration ID and set as default
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
    
    // Ensure default configuration flag is correct
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
      throw new Error('Configuration does not exist');
    }

    // If the deleted configuration is the default, set the first one as default
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
      throw new Error('Configuration does not exist');
    }

    localStorage.setItem(DEFAULT_CONFIG_KEY, id);
  }

  async getDefaultConfig(): Promise<SavedApiConfig | null> {
    const defaultId = localStorage.getItem(DEFAULT_CONFIG_KEY);
    if (!defaultId) return null;

    return await this.getConfig(defaultId);
  }
}

// Export singleton instance
export const apiConfigManager = new ApiConfigManagerImpl();
