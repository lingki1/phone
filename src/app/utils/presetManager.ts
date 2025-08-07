'use client';

import { dataManager } from './dataManager';
import { PresetConfig, PresetTemplate } from '../types/preset';

// 默认预设模板
export const DEFAULT_PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'creative',
    name: '创意模式',
    description: '高创造性，适合创意写作和头脑风暴',
    category: 'creative',
    config: {
      temperature: 0.9,
      maxTokens: 2000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      isDefault: false
    }
  },
  {
    id: 'balanced',
    name: '平衡模式',
    description: '平衡的创造性和一致性，适合一般对话',
    category: 'balanced',
    config: {
      temperature: 0.7,
      maxTokens: 1500,
      topP: 0.8,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      isDefault: true
    }
  },
  {
    id: 'precise',
    name: '精确模式',
    description: '低创造性，高一致性，适合事实性回答',
    category: 'precise',
    config: {
      temperature: 0.3,
      maxTokens: 1000,
      topP: 0.7,
      frequencyPenalty: -0.1,
      presencePenalty: 0.1,
      isDefault: false
    }
  },
  {
    id: 'concise',
    name: '简洁模式',
    description: '简短精炼的回答，适合快速获取信息',
    category: 'concise',
    config: {
      temperature: 0.5,
      maxTokens: 500,
      topP: 0.8,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1,
      isDefault: false
    }
  },
  {
    id: 'detailed',
    name: '详细模式',
    description: '详细全面的回答，适合深度分析',
    category: 'detailed',
    config: {
      temperature: 0.6,
      maxTokens: 3000,
      topP: 0.9,
      frequencyPenalty: -0.1,
      presencePenalty: 0.2,
      isDefault: false
    }
  }
];

// 预设分类
export const PRESET_CATEGORIES = [
  { id: 'creative', name: '创意', description: '高创造性预设', icon: '🎨' },
  { id: 'balanced', name: '平衡', description: '平衡型预设', icon: '⚖️' },
  { id: 'precise', name: '精确', description: '精确型预设', icon: '🎯' },
  { id: 'concise', name: '简洁', description: '简洁型预设', icon: '📝' },
  { id: 'detailed', name: '详细', description: '详细型预设', icon: '📊' },
  { id: 'custom', name: '自定义', description: '用户自定义预设', icon: '⚙️' }
];

export class PresetManager {
  private static instance: PresetManager;
  private currentPreset: PresetConfig | null = null;
  private readonly STORAGE_KEY = 'user-preset-settings';
  private readonly PRESETS_KEY = 'user-presets';

  private constructor() {
    // 私有构造函数，确保单例模式
  }

  public static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      PresetManager.instance = new PresetManager();
    }
    return PresetManager.instance;
  }

  // 获取所有预设
  public async getAllPresets(): Promise<PresetConfig[]> {
    try {
      await dataManager.initDB();
      const presets = await dataManager.getAllPresets();
      return presets || [];
    } catch (error) {
      console.error('Failed to get presets from database:', error);
      // 回退到localStorage
      return this.loadPresetsFromLocalStorage();
    }
  }

  // 获取当前预设
  public async getCurrentPreset(): Promise<PresetConfig | null> {
    if (this.currentPreset) {
      return this.currentPreset;
    }

    try {
      const settings = this.loadPresetSettingsFromLocalStorage();
      if (settings?.currentPresetId) {
        const presets = await this.getAllPresets();
        this.currentPreset = presets.find(p => p.id === settings.currentPresetId) || null;
      }
      
      // 如果没有设置当前预设，使用默认预设
      if (!this.currentPreset) {
        const presets = await this.getAllPresets();
        this.currentPreset = presets.find(p => p.isDefault) || presets[0] || null;
      }
      
      return this.currentPreset;
    } catch (error) {
      console.error('Failed to get current preset:', error);
      return null;
    }
  }

  // 设置当前预设
  public async setCurrentPreset(presetId: string): Promise<void> {
    try {
      const presets = await this.getAllPresets();
      const preset = presets.find(p => p.id === presetId);
      
      if (!preset) {
        throw new Error(`Preset with id ${presetId} not found`);
      }

      this.currentPreset = preset;
      
      // 保存设置
      const settings = this.loadPresetSettingsFromLocalStorage();
      settings.currentPresetId = presetId;
      settings.lastUpdated = Date.now();
      this.savePresetSettingsToLocalStorage(settings);
      
      // 触发事件
      this.updateAllComponents();
      
      console.log(`Current preset set to: ${preset.name}`);
    } catch (error) {
      console.error('Failed to set current preset:', error);
      throw error;
    }
  }

  // 创建新预设
  public async createPreset(preset: Omit<PresetConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<PresetConfig> {
    try {
      const newPreset: PresetConfig = {
        ...preset,
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await dataManager.initDB();
      await dataManager.savePreset(newPreset);
      
      // 更新localStorage
      const presets = await this.getAllPresets();
      presets.push(newPreset);
      this.savePresetsToLocalStorage(presets);
      
      console.log('Preset created:', newPreset.name);
      return newPreset;
    } catch (error) {
      console.error('Failed to create preset:', error);
      throw error;
    }
  }

  // 更新预设
  public async updatePreset(preset: PresetConfig): Promise<void> {
    try {
      const updatedPreset = {
        ...preset,
        updatedAt: Date.now()
      };

      await dataManager.initDB();
      await dataManager.savePreset(updatedPreset);
      
      // 更新localStorage
      const presets = await this.getAllPresets();
      const index = presets.findIndex(p => p.id === preset.id);
      if (index !== -1) {
        presets[index] = updatedPreset;
        this.savePresetsToLocalStorage(presets);
      }
      
      // 如果更新的是当前预设，也要更新当前预设
      if (this.currentPreset?.id === preset.id) {
        this.currentPreset = updatedPreset;
      }
      
      console.log('Preset updated:', updatedPreset.name);
    } catch (error) {
      console.error('Failed to update preset:', error);
      throw error;
    }
  }

  // 删除预设
  public async deletePreset(presetId: string): Promise<void> {
    try {
      await dataManager.initDB();
      await dataManager.deletePreset(presetId);
      
      // 更新localStorage
      const presets = await this.getAllPresets();
      const filteredPresets = presets.filter(p => p.id !== presetId);
      this.savePresetsToLocalStorage(filteredPresets);
      
      // 如果删除的是当前预设，重置为默认预设
      if (this.currentPreset?.id === presetId) {
        const defaultPreset = filteredPresets.find(p => p.isDefault) || filteredPresets[0];
        if (defaultPreset) {
          await this.setCurrentPreset(defaultPreset.id);
        } else {
          this.currentPreset = null;
        }
      }
      
      console.log('Preset deleted:', presetId);
    } catch (error) {
      console.error('Failed to delete preset:', error);
      throw error;
    }
  }

  // 初始化默认预设
  public async initializeDefaultPresets(): Promise<void> {
    try {
      const existingPresets = await this.getAllPresets();
      
      // 检查是否已经存在默认预设（通过名称匹配）
      const existingPresetNames = existingPresets.map(p => p.name);
      const missingTemplates = DEFAULT_PRESET_TEMPLATES.filter(
        template => !existingPresetNames.includes(template.name)
      );
      
      // 只为缺失的模板创建预设
      if (missingTemplates.length > 0) {
        console.log(`Creating ${missingTemplates.length} missing default presets...`);
        
        for (const template of missingTemplates) {
          const preset: Omit<PresetConfig, 'id' | 'createdAt' | 'updatedAt'> = {
            name: template.name,
            description: template.description,
            isDefault: template.config.isDefault,
            ...template.config
          };
          
          await this.createPreset(preset);
        }
        
        console.log('Missing default presets created');
      } else {
        console.log('All default presets already exist, skipping initialization');
      }
      
      // 检查并修复重复的默认预设
      await this.cleanupDuplicateDefaultPresets();
    } catch (error) {
      console.error('Failed to initialize default presets:', error);
      throw error;
    }
  }

  // 清理重复的默认预设
  private async cleanupDuplicateDefaultPresets(): Promise<void> {
    try {
      const existingPresets = await this.getAllPresets();
      const defaultPresetNames = DEFAULT_PRESET_TEMPLATES.map(t => t.name);
      
      // 找出重复的默认预设（按名称分组）
      const presetGroups = new Map<string, PresetConfig[]>();
      
      for (const preset of existingPresets) {
        if (defaultPresetNames.includes(preset.name)) {
          if (!presetGroups.has(preset.name)) {
            presetGroups.set(preset.name, []);
          }
          presetGroups.get(preset.name)!.push(preset);
        }
      }
      
      // 处理重复的预设
      for (const [presetName, presets] of presetGroups) {
        if (presets.length > 1) {
          console.log(`Found ${presets.length} duplicate presets for "${presetName}", cleaning up...`);
          
          // 保留最新的一个，删除其他的
          const sortedPresets = presets.sort((a, b) => b.updatedAt - a.updatedAt);
          const deletePresets = sortedPresets.slice(1);
          
          for (const deletePreset of deletePresets) {
            await this.deletePreset(deletePreset.id);
            console.log(`Deleted duplicate preset: ${deletePreset.name} (ID: ${deletePreset.id})`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup duplicate default presets:', error);
    }
  }

  // 从模板创建预设
  public async createFromTemplate(templateId: string, customName?: string): Promise<PresetConfig> {
    const template = DEFAULT_PRESET_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    const preset: Omit<PresetConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: customName || template.name,
      description: template.description,
      isDefault: false,
      ...template.config
    };

    return await this.createPreset(preset);
  }

  // 验证预设配置
  public validatePreset(preset: Partial<PresetConfig>): string[] {
    const errors: string[] = [];

    if (!preset.name?.trim()) {
      errors.push('预设名称不能为空');
    }

    if (preset.temperature !== undefined && (preset.temperature < 0 || preset.temperature > 2)) {
      errors.push('温度值必须在 0-2 之间');
    }

    if (preset.maxTokens !== undefined && (preset.maxTokens < 0 || preset.maxTokens > 63000)) {
      errors.push('最大令牌数必须在 0-63000 之间，0表示无限制');
    }

    if (preset.topP !== undefined && (preset.topP < 0 || preset.topP > 1)) {
      errors.push('Top P 值必须在 0-1 之间');
    }

    if (preset.frequencyPenalty !== undefined && (preset.frequencyPenalty < -2 || preset.frequencyPenalty > 2)) {
      errors.push('频率惩罚必须在 -2.0 到 2.0 之间');
    }

    if (preset.presencePenalty !== undefined && (preset.presencePenalty < -2 || preset.presencePenalty > 2)) {
      errors.push('存在惩罚必须在 -2.0 到 2.0 之间');
    }

    return errors;
  }

  // 获取预设模板
  public getPresetTemplates(): PresetTemplate[] {
    return DEFAULT_PRESET_TEMPLATES;
  }

  // 获取预设分类
  public getPresetCategories() {
    return PRESET_CATEGORIES;
  }

  // 手动清理重复的默认预设（供用户主动调用）
  public async cleanupDuplicatePresets(): Promise<{ cleaned: number; message: string }> {
    try {
      const existingPresets = await this.getAllPresets();
      const defaultPresetNames = DEFAULT_PRESET_TEMPLATES.map(t => t.name);
      
      // 找出重复的默认预设（按名称分组）
      const presetGroups = new Map<string, PresetConfig[]>();
      
      for (const preset of existingPresets) {
        if (defaultPresetNames.includes(preset.name)) {
          if (!presetGroups.has(preset.name)) {
            presetGroups.set(preset.name, []);
          }
          presetGroups.get(preset.name)!.push(preset);
        }
      }
      
      let totalCleaned = 0;
      const cleanedPresets: string[] = [];
      
      // 处理重复的预设
      for (const [presetName, presets] of presetGroups) {
        if (presets.length > 1) {
          console.log(`Found ${presets.length} duplicate presets for "${presetName}", cleaning up...`);
          
          // 保留最新的一个，删除其他的
          const sortedPresets = presets.sort((a, b) => b.updatedAt - a.updatedAt);
          const deletePresets = sortedPresets.slice(1);
          
          for (const deletePreset of deletePresets) {
            await this.deletePreset(deletePreset.id);
            cleanedPresets.push(deletePreset.name);
            totalCleaned++;
            console.log(`Deleted duplicate preset: ${deletePreset.name} (ID: ${deletePreset.id})`);
          }
        }
      }
      
      if (totalCleaned > 0) {
        const message = `成功清理了 ${totalCleaned} 个重复的预设：${cleanedPresets.join(', ')}`;
        return { cleaned: totalCleaned, message };
      } else {
        return { cleaned: 0, message: '没有发现重复的预设' };
      }
    } catch (error) {
      console.error('Failed to cleanup duplicate presets:', error);
      throw new Error(`清理重复预设失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 私有方法：从localStorage加载预设
  private loadPresetsFromLocalStorage(): PresetConfig[] {
    try {
      const presetsData = localStorage.getItem(this.PRESETS_KEY);
      return presetsData ? JSON.parse(presetsData) : [];
    } catch (error) {
      console.error('Failed to load presets from localStorage:', error);
      return [];
    }
  }

  // 私有方法：保存预设到localStorage
  private savePresetsToLocalStorage(presets: PresetConfig[]): void {
    try {
      localStorage.setItem(this.PRESETS_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save presets to localStorage:', error);
    }
  }

  // 私有方法：从localStorage加载预设设置
  private loadPresetSettingsFromLocalStorage(): { currentPresetId?: string; lastUpdated?: number } {
    try {
      const settingsData = localStorage.getItem(this.STORAGE_KEY);
      return settingsData ? JSON.parse(settingsData) : {};
    } catch (error) {
      console.error('Failed to load preset settings from localStorage:', error);
      return {};
    }
  }

  // 私有方法：保存预设设置到localStorage
  private savePresetSettingsToLocalStorage(settings: { currentPresetId?: string; lastUpdated?: number }): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save preset settings to localStorage:', error);
    }
  }

  // 私有方法：更新所有组件
  private updateAllComponents(): void {
    // 触发自定义事件，通知其他组件预设已更改
    window.dispatchEvent(new CustomEvent('presetChanged', {
      detail: { preset: this.currentPreset }
    }));
  }
}

// 导出单例实例
export const presetManager = PresetManager.getInstance(); 