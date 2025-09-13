'use client';

import { dataManager } from './dataManager';
import { PresetConfig, PresetTemplate } from '../types/preset';

// Default preset templates
export const DEFAULT_PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'creative',
    name: 'Creative Mode',
    description: 'High creativity, suitable for creative writing and brainstorming',
    category: 'creative',
    config: {
      temperature: 0.9,
      maxTokens: 8000,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      isDefault: false
    }
  },
  {
    id: 'balanced',
    name: 'Balanced Mode',
    description: 'Balanced creativity and consistency, suitable for general conversation',
    category: 'balanced',
    config: {
      temperature: 0.7,
      maxTokens: 8000,
      topP: 0.8,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      isDefault: true
    }
  },
  {
    id: 'precise',
    name: 'Precise Mode',
    description: 'Low creativity, high consistency, suitable for factual answers',
    category: 'precise',
    config: {
      temperature: 0.3,
      maxTokens: 8000,
      topP: 0.7,
      frequencyPenalty: -0.1,
      presencePenalty: 0.1,
      isDefault: false
    }
  },
  {
    id: 'concise',
    name: 'Concise Mode',
    description: 'Short and concise answers, suitable for quick information retrieval',
    category: 'concise',
    config: {
      temperature: 0.5,
      maxTokens: 8000,
      topP: 0.8,
      frequencyPenalty: 0.2,
      presencePenalty: 0.1,
      isDefault: false
    }
  },
  {
    id: 'detailed',
    name: 'Detailed Mode',
    description: 'Detailed and comprehensive answers, suitable for in-depth analysis',
    category: 'detailed',
    config: {
      temperature: 0.6,
      maxTokens: 8000,
      topP: 0.9,
      frequencyPenalty: -0.1,
      presencePenalty: 0.2,
      isDefault: false
    }
  }
];

// Preset categories
export const PRESET_CATEGORIES = [
  { id: 'creative', name: 'Creative', description: 'High creativity presets', icon: '🎨' },
  { id: 'balanced', name: 'Balanced', description: 'Balanced presets', icon: '⚖️' },
  { id: 'precise', name: 'Precise', description: 'Precise presets', icon: '🎯' },
  { id: 'concise', name: 'Concise', description: 'Concise presets', icon: '📝' },
  { id: 'detailed', name: 'Detailed', description: 'Detailed presets', icon: '📊' },
  { id: 'custom', name: 'Custom', description: 'User custom presets', icon: '⚙️' }
];

export class PresetManager {
  private static instance: PresetManager;
  private currentPreset: PresetConfig | null = null;
  private readonly STORAGE_KEY = 'user-preset-settings';
  private readonly PRESETS_KEY = 'user-presets';

  private constructor() {
    // Private constructor to ensure singleton pattern
  }

  public static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      PresetManager.instance = new PresetManager();
    }
    return PresetManager.instance;
  }

  // Get all presets
  public async getAllPresets(): Promise<PresetConfig[]> {
    try {
      await dataManager.initDB();
      const presets = await dataManager.getAllPresets();
      return presets || [];
    } catch (error) {
      console.error('Failed to get presets from database:', error);
      // Fallback to localStorage
      return this.loadPresetsFromLocalStorage();
    }
  }

  // Get current preset
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
      
      // If no current preset is set, use default preset
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

  // Set current preset
  public async setCurrentPreset(presetId: string): Promise<void> {
    try {
      const presets = await this.getAllPresets();
      const preset = presets.find(p => p.id === presetId);
      
      if (!preset) {
        throw new Error(`Preset with id ${presetId} not found`);
      }

      this.currentPreset = preset;
      
      // Save settings
      const settings = this.loadPresetSettingsFromLocalStorage();
      settings.currentPresetId = presetId;
      settings.lastUpdated = Date.now();
      this.savePresetSettingsToLocalStorage(settings);
      
      // Trigger event
      this.updateAllComponents();
      
      console.log(`Current preset set to: ${preset.name}`);
    } catch (error) {
      console.error('Failed to set current preset:', error);
      throw error;
    }
  }

  // Create new preset
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

  // Update preset
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
      
      // If updating current preset, also update current preset
      if (this.currentPreset?.id === preset.id) {
        this.currentPreset = updatedPreset;
      }
      
      console.log('Preset updated:', updatedPreset.name);
    } catch (error) {
      console.error('Failed to update preset:', error);
      throw error;
    }
  }

  // Delete preset
  public async deletePreset(presetId: string): Promise<void> {
    try {
      await dataManager.initDB();
      await dataManager.deletePreset(presetId);
      
      // 更新localStorage
      const presets = await this.getAllPresets();
      const filteredPresets = presets.filter(p => p.id !== presetId);
      this.savePresetsToLocalStorage(filteredPresets);
      
      // If deleting current preset, reset to default preset
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

  // Initialize default presets
  public async initializeDefaultPresets(): Promise<void> {
    try {
      const existingPresets = await this.getAllPresets();
      
      // Check if default presets already exist (by name matching)
      const existingPresetNames = existingPresets.map(p => p.name);
      const missingTemplates = DEFAULT_PRESET_TEMPLATES.filter(
        template => !existingPresetNames.includes(template.name)
      );
      
      // Only create presets for missing templates
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
      
      // Check and fix duplicate default presets
      await this.cleanupDuplicateDefaultPresets();
    } catch (error) {
      console.error('Failed to initialize default presets:', error);
      throw error;
    }
  }

  // Cleanup duplicate default presets
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

  // Create preset from template
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

  // Validate preset configuration
  public validatePreset(preset: Partial<PresetConfig>): string[] {
    const errors: string[] = [];

    if (!preset.name?.trim()) {
      errors.push('Preset name cannot be empty');
    }

    if (preset.temperature !== undefined && (preset.temperature < 0 || preset.temperature > 2)) {
      errors.push('Temperature value must be between 0-2');
    }

    if (preset.maxTokens !== undefined && (preset.maxTokens < 0 || preset.maxTokens > 63000)) {
      errors.push('Max tokens must be between 0-63000, 0 means unlimited');
    }

    if (preset.topP !== undefined && (preset.topP < 0 || preset.topP > 1)) {
      errors.push('Top P value must be between 0-1');
    }

    if (preset.frequencyPenalty !== undefined && (preset.frequencyPenalty < -2 || preset.frequencyPenalty > 2)) {
      errors.push('Frequency penalty must be between -2.0 to 2.0');
    }

    if (preset.presencePenalty !== undefined && (preset.presencePenalty < -2 || preset.presencePenalty > 2)) {
      errors.push('Presence penalty must be between -2.0 to 2.0');
    }

    return errors;
  }

  // Get preset templates
  public getPresetTemplates(): PresetTemplate[] {
    return DEFAULT_PRESET_TEMPLATES;
  }

  // Get preset categories
  public getPresetCategories() {
    return PRESET_CATEGORIES;
  }

  // Manually cleanup duplicate default presets (for user-initiated calls)
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
          // 保留最新的一个，删除其他的
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
        const message = `Successfully cleaned up ${totalCleaned} duplicate presets: ${cleanedPresets.join(', ')}`;
        return { cleaned: totalCleaned, message };
      } else {
        return { cleaned: 0, message: 'No duplicate presets found' };
      }
    } catch (error) {
      console.error('Failed to cleanup duplicate presets:', error);
      throw new Error(`Failed to cleanup duplicate presets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private method: load presets from localStorage
  private loadPresetsFromLocalStorage(): PresetConfig[] {
    try {
      const presetsData = localStorage.getItem(this.PRESETS_KEY);
      return presetsData ? JSON.parse(presetsData) : [];
    } catch (error) {
      console.error('Failed to load presets from localStorage:', error);
      return [];
    }
  }

  // Private method: save presets to localStorage
  private savePresetsToLocalStorage(presets: PresetConfig[]): void {
    try {
      localStorage.setItem(this.PRESETS_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save presets to localStorage:', error);
    }
  }

  // Private method: load presets from localStorage设置
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

  // Private method: update all components
  private updateAllComponents(): void {
    // Trigger custom event to notify other components that preset has changed
    window.dispatchEvent(new CustomEvent('presetChanged', {
      detail: { preset: this.currentPreset }
    }));
  }
}

// Export singleton instance
export const presetManager = PresetManager.getInstance(); 