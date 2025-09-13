'use client';

import { dataManager } from './dataManager';
import { showThemeSuccess, showThemeError, showThemeLoading, hideThemeLoading } from './themeNotification';
import { themeStateManager } from './themeStateManager';

// 主题接口定义
export interface Theme {
  id: string;
  name: string;
  description: string;
  className: string;
  category: 'basic' | 'gender' | 'style' | 'nature' | 'custom';
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    gradient?: string;
  };
  isCustom?: boolean;
  customColors?: CustomThemeColors;
}

// 自定义主题颜色配置
export interface CustomThemeColors {
  // 背景色
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  
  // 文本色
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  
  // 强调色
  accentColor: string;
  accentHover: string;
  
  // 边框色
  borderColor: string;
  borderLight: string;
  
  // 阴影
  shadowLight: string;
  shadowMedium: string;
  shadowHeavy: string;
  
  // 气泡样式
  bubbleStyle: {
    userBubble: {
      bg: string;
      text: string;
      borderRadius: string;
    };
    aiBubble: {
      bg: string;
      text: string;
      borderRadius: string;
    };
  };
  
  // 特殊元素
  successColor: string;
  warningColor: string;
  errorColor: string;
  infoColor: string;
}

// 用户主题设置接口
export interface UserThemeSettings {
  selectedTheme: string;
  lastUpdated: number;
  customThemes?: Theme[];
}

// 可用主题列表
export const AVAILABLE_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default White',
    description: 'Clean and fresh white theme',
    className: '',
    category: 'basic',
    preview: { primary: '#ffffff', secondary: '#f8f9fa', accent: '#007bff' }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Eye-friendly dark theme',
    className: 'theme-dark',
    category: 'basic',
    preview: { primary: '#1a1a1a', secondary: '#2d2d2d', accent: '#4dabf7' }
  },
  {
    id: 'masculine',
    name: 'Masculine Style',
    description: 'Deep blue business style, stable and elegant',
    className: 'theme-masculine',
    category: 'gender',
    preview: { primary: '#0f1419', secondary: '#1a2332', accent: '#00d4ff' }
  },
  {
    id: 'feminine',
    name: 'Feminine Style',
    description: 'Pink gentle style, elegant and romantic',
    className: 'theme-feminine',
    category: 'gender',
    preview: { primary: '#fdf2f8', secondary: '#fce7f3', accent: '#f472b6' }
  },
  {
    id: 'anime',
    name: 'Anime Style',
    description: 'Purple dreamy style, full of imagination',
    className: 'theme-anime',
    category: 'style',
    preview: { 
      primary: '#f3e8ff', 
      secondary: '#e9d5ff', 
      accent: '#c084fc', 
      gradient: 'linear-gradient(135deg, #c084fc, #a855f7)' 
    }
  },
  {
    id: 'cute',
    name: 'Cute Style',
    description: 'Orange lively style, youthful and cute',
    className: 'theme-cute',
    category: 'style',
    preview: { primary: '#fff7ed', secondary: '#ffedd5', accent: '#ff8c42' }
  },
  {
    id: 'metal',
    name: 'Metal Style',
    description: 'Silver-gray tech style, modern and minimalist',
    className: 'theme-metal',
    category: 'style',
    preview: { 
      primary: '#f8fafc', 
      secondary: '#e2e8f0', 
      accent: '#475569', 
      gradient: 'linear-gradient(135deg, #475569, #334155)' 
    }
  },
  {
    id: 'forest',
    name: 'Forest Theme',
    description: 'Green natural style, fresh and natural',
    className: 'theme-forest',
    category: 'nature',
    preview: { primary: '#f0fdf4', secondary: '#dcfce7', accent: '#16a34a' }
  },
  {
    id: 'ocean',
    name: 'Ocean Theme',
    description: 'Blue-green gradient style, peaceful and deep',
    className: 'theme-ocean',
    category: 'nature',
    preview: { 
      primary: '#ecfeff', 
      secondary: '#cffafe', 
      accent: '#0891b2', 
      gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)' 
    }
  },
  {
    id: 'sunset',
    name: 'Sunset Theme',
    description: 'Orange-red gradient style, warm and romantic',
    className: 'theme-sunset',
    category: 'nature',
    preview: { 
      primary: '#fef3c7', 
      secondary: '#fde68a', 
      accent: '#f59e0b', 
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' 
    }
  },
  {
    id: 'minimal',
    name: 'Minimal Theme',
    description: 'Black and white minimalist style, pure and elegant',
    className: 'theme-minimal',
    category: 'basic',
    preview: { primary: '#ffffff', secondary: '#f9f9f9', accent: '#000000' }
  }
];

// 主题管理器类
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: string = 'default';
  private readonly STORAGE_KEY = 'user-theme-settings';

  private constructor() {
    // 私有构造函数，确保单例模式
  }

  /**
   * 获取ThemeManager单例实例
   */
  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * 获取所有可用主题
   */
  public getAvailableThemes(): Theme[] {
    return AVAILABLE_THEMES;
  }

  /**
   * 根据分类获取主题
   */
  public getThemesByCategory(category: string): Theme[] {
    return AVAILABLE_THEMES.filter(theme => theme.category === category);
  }

  /**
   * 获取当前主题ID
   */
  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  /**
   * 根据ID获取主题对象
   */
  public async getThemeById(id: string): Promise<Theme | undefined> {
    // 首先在预设主题中查找
    const presetTheme = AVAILABLE_THEMES.find(theme => theme.id === id);
    if (presetTheme) return presetTheme;

    // 然后在自定义主题中查找
    try {
      const settings = await this.loadThemeFromDataManager();
      const customTheme = settings?.customThemes?.find(theme => theme.id === id);
      return customTheme;
    } catch (error) {
      console.warn('Failed to load custom theme:', error);
      return undefined;
    }
  }

  /**
   * 设置主题
   */
  public async setTheme(themeId: string): Promise<void> {
    const previousThemeId = this.currentTheme;
    
    try {
      // 开始主题切换状态
      themeStateManager.startThemeChange(themeId);
      showThemeLoading();
      
      const theme = await this.getThemeById(themeId);
      if (!theme) {
        console.warn(`Theme with id "${themeId}" not found, falling back to default`);
        themeId = 'default';
      }

      // 添加短暂延迟，让用户看到加载状态
      await new Promise(resolve => setTimeout(resolve, 300));

      // 应用主题到DOM
      if (theme?.isCustom && theme.customColors) {
        this.applyCustomTheme(theme);
      } else {
        this.applyThemeToDOM(theme?.className || '');
      }
      
      // 更新当前主题
      this.currentTheme = themeId;
      
      // 保存主题设置
      await this.saveTheme(themeId);
      
      // 触发主题更新事件
      this.updateAllComponents();
      
      // 完成主题切换状态
      themeStateManager.completeThemeChange();
      hideThemeLoading();
      
      // 显示成功通知
      if (theme && previousThemeId !== themeId) {
        showThemeSuccess(theme);
      }
      
      console.log(`Theme changed to: ${themeId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // 主题切换失败状态
      themeStateManager.failThemeChange(errorMessage);
      hideThemeLoading();
      
      console.error('Failed to set theme:', error);
      showThemeError(`Theme switching failed: ${errorMessage}`);
      
      // 发生错误时回退到默认主题
      if (themeId !== 'default') {
        await this.setTheme('default');
      }
    }
  }

  /**
   * 加载保存的主题
   */
  public async loadSavedTheme(): Promise<void> {
    try {
      // 首先尝试从localStorage加载（更快）
      const localSettings = this.loadThemeFromLocalStorage();
      if (localSettings && localSettings.selectedTheme) {
        await this.setThemeInternal(localSettings.selectedTheme);
        return;
      }

      // 如果localStorage没有数据，尝试从dataManager加载
      try {
        await this.initDBWithTimeout();
        const settings = await this.loadThemeFromDataManager();
        
        if (settings && settings.selectedTheme) {
          await this.setThemeInternal(settings.selectedTheme);
          return;
        }
      } catch (dbError) {
        console.warn('Failed to load theme from database:', dbError);
      }
      
      // 如果都没有，使用默认主题
      await this.setThemeInternal('default');
    } catch (error) {
      console.error('Failed to load saved theme:', error);
      // 加载失败时使用默认主题
      await this.setThemeInternal('default');
    }
  }

  /**
   * 内部主题设置方法（不显示加载状态，用于初始化）
   */
  private async setThemeInternal(themeId: string): Promise<void> {
    try {
      const theme = await this.getThemeById(themeId);
      if (!theme) {
        console.warn(`Theme with id "${themeId}" not found, falling back to default`);
        themeId = 'default';
      }

      // 直接应用主题到DOM，不显示加载状态
      if (theme?.isCustom && theme.customColors) {
        this.applyCustomTheme(theme);
      } else {
        this.applyThemeToDOM(theme?.className || '');
      }
      
      // 更新当前主题
      this.currentTheme = themeId;
      
      // 触发主题更新事件
      this.updateAllComponents();
      
      console.log(`Theme initialized to: ${themeId}`);
    } catch (error) {
      console.error('Failed to set theme internally:', error);
      // 发生错误时回退到默认主题
      if (themeId !== 'default') {
        await this.setThemeInternal('default');
      }
    }
  }

  /**
   * 带超时保护的数据库初始化
   */
  private async initDBWithTimeout(): Promise<void> {
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout')), 2000);
    });

    try {
      await Promise.race([
        dataManager.initDB(),
        timeoutPromise
      ]);
    } catch (error) {
      console.warn('Database initialization failed or timed out:', error);
      throw error;
    }
  }

  /**
   * 应用主题到DOM
   */
  private applyThemeToDOM(className: string): void {
    const body = document.body;
    
    // 移除所有现有的主题类
    AVAILABLE_THEMES.forEach(theme => {
      if (theme.className) {
        body.classList.remove(theme.className);
      }
    });
    
    // 添加新的主题类
    if (className) {
      body.classList.add(className);
    }
  }

  /**
   * 保存主题设置
   */
  private async saveTheme(themeId: string): Promise<void> {
    const settings: UserThemeSettings = {
      selectedTheme: themeId,
      lastUpdated: Date.now()
    };

    try {
      // 优先保存到dataManager
      await this.saveThemeToDataManager(settings);
    } catch (error) {
      console.warn('Failed to save theme to dataManager, using localStorage:', error);
      // 备用方案：保存到localStorage
      this.saveThemeToLocalStorage(settings);
    }
  }

  /**
   * 从dataManager加载主题设置
   */
  private async loadThemeFromDataManager(): Promise<UserThemeSettings | null> {
    try {
      const settings = await dataManager.getThemeSettings();
      return settings;
    } catch (error) {
      console.error('Failed to load theme from dataManager:', error);
      return null;
    }
  }

  /**
   * 保存主题设置到dataManager
   */
  private async saveThemeToDataManager(settings: UserThemeSettings): Promise<void> {
    try {
      await dataManager.saveThemeSettings(settings);
    } catch (error) {
      console.error('Failed to save theme to dataManager:', error);
      throw error;
    }
  }

  /**
   * 从localStorage加载主题设置
   */
  private loadThemeFromLocalStorage(): UserThemeSettings | null {
    try {
      const settings = localStorage.getItem(this.STORAGE_KEY);
      return settings ? JSON.parse(settings) : null;
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error);
      return null;
    }
  }

  /**
   * 保存主题设置到localStorage
   */
  private saveThemeToLocalStorage(settings: UserThemeSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  }

  /**
   * 更新所有组件（触发重新渲染）
   */
  private updateAllComponents(): void {
    // 触发自定义事件，通知组件主题已更改
    const event = new CustomEvent('themeChanged', {
      detail: { 
        themeId: this.currentTheme,
        timestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * 预览主题（临时应用，不保存）
   */
  public async previewTheme(themeId: string): Promise<void> {
    const theme = await this.getThemeById(themeId);
    if (theme) {
      themeStateManager.startPreview(themeId);
      if (theme.isCustom && theme.customColors) {
        this.applyCustomTheme(theme);
      } else {
        this.applyThemeToDOM(theme.className);
      }
    }
  }

  /**
   * 取消预览，恢复当前主题
   */
  public async cancelPreview(): Promise<void> {
    themeStateManager.endPreview();
    const currentTheme = await this.getThemeById(this.currentTheme);
    if (currentTheme) {
      if (currentTheme.isCustom && currentTheme.customColors) {
        this.applyCustomTheme(currentTheme);
      } else {
        this.applyThemeToDOM(currentTheme.className);
      }
    }
  }

  /**
   * 检查浏览器是否支持CSS变量
   */
  public isCSSVariablesSupported(): boolean {
    return window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--fake-var)');
  }

  /**
   * 获取主题分类列表
   */
  public getCategories(): Array<{id: string, name: string}> {
    return [
      { id: 'basic', name: 'Basic Themes' },
      { id: 'gender', name: 'Gender Styles' },
      { id: 'style', name: 'Personality Styles' },
      { id: 'nature', name: 'Nature Themes' },
      { id: 'custom', name: 'Custom Themes' }
    ];
  }

  /**
   * 获取所有主题（包括自定义主题）
   */
  public async getAllThemes(): Promise<Theme[]> {
    try {
      const settings = await this.loadThemeFromDataManager();
      const customThemes = settings?.customThemes || [];
      return [...AVAILABLE_THEMES, ...customThemes];
    } catch (error) {
      console.warn('Failed to load custom themes:', error);
      return AVAILABLE_THEMES;
    }
  }

  /**
   * 保存自定义主题
   */
  public async saveCustomTheme(theme: Theme): Promise<void> {
    try {
      const settings = await this.loadThemeFromDataManager() || {
        selectedTheme: this.currentTheme,
        lastUpdated: Date.now(),
        customThemes: []
      };

      // 检查是否已存在同名主题
      const existingIndex = settings.customThemes?.findIndex(t => t.id === theme.id) ?? -1;
      
      if (existingIndex >= 0) {
        // 更新现有主题
        settings.customThemes![existingIndex] = theme;
      } else {
        // 添加新主题
        settings.customThemes = [...(settings.customThemes || []), theme];
      }

      settings.lastUpdated = Date.now();
      await this.saveThemeToDataManager(settings);
      
      console.log(`Custom theme "${theme.name}" saved successfully`);
    } catch (error) {
      console.error('Failed to save custom theme:', error);
      throw error;
    }
  }

  /**
   * 删除自定义主题
   */
  public async deleteCustomTheme(themeId: string): Promise<void> {
    try {
      const settings = await this.loadThemeFromDataManager();
      if (!settings?.customThemes) return;

      settings.customThemes = settings.customThemes.filter(t => t.id !== themeId);
      settings.lastUpdated = Date.now();
      
      await this.saveThemeToDataManager(settings);
      
      // 如果删除的是当前主题，切换到默认主题
      if (this.currentTheme === themeId) {
        await this.setTheme('default');
      }
      
      console.log(`Custom theme "${themeId}" deleted successfully`);
    } catch (error) {
      console.error('Failed to delete custom theme:', error);
      throw error;
    }
  }

  /**
   * 生成自定义主题的CSS变量
   */
  public generateCustomThemeCSS(colors: CustomThemeColors): string {
    return `
      :root {
        --theme-bg-primary: ${colors.bgPrimary};
        --theme-bg-secondary: ${colors.bgSecondary};
        --theme-bg-tertiary: ${colors.bgTertiary};
        --theme-text-primary: ${colors.textPrimary};
        --theme-text-secondary: ${colors.textSecondary};
        --theme-text-tertiary: ${colors.textTertiary};
        --theme-accent-color: ${colors.accentColor};
        --theme-accent-hover: ${colors.accentHover};
        --theme-border-color: ${colors.borderColor};
        --theme-border-light: ${colors.borderLight};
        --theme-shadow-light: ${colors.shadowLight};
        --theme-shadow-medium: ${colors.shadowMedium};
        --theme-shadow-heavy: ${colors.shadowHeavy};
        --theme-success-color: ${colors.successColor};
        --theme-warning-color: ${colors.warningColor};
        --theme-error-color: ${colors.errorColor};
        --theme-info-color: ${colors.infoColor};
        
        /* Bubble styles */
        --theme-user-bubble-bg: ${colors.bubbleStyle.userBubble.bg};
        --theme-user-bubble-text: ${colors.bubbleStyle.userBubble.text};
        --theme-user-bubble-radius: ${colors.bubbleStyle.userBubble.borderRadius};
        --theme-ai-bubble-bg: ${colors.bubbleStyle.aiBubble.bg};
        --theme-ai-bubble-text: ${colors.bubbleStyle.aiBubble.text};
        --theme-ai-bubble-radius: ${colors.bubbleStyle.aiBubble.borderRadius};
      }
    `;
  }

  /**
   * 应用自定义主题到DOM
   */
  public applyCustomTheme(theme: Theme): void {
    if (!theme.isCustom || !theme.customColors) {
      console.warn('Theme is not a custom theme or missing custom colors');
      return;
    }

    // 生成并注入CSS
    const css = this.generateCustomThemeCSS(theme.customColors);
    
    // 移除现有的自定义主题样式
    const existingStyle = document.getElementById('custom-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // 创建新的样式元素
    const styleElement = document.createElement('style');
    styleElement.id = 'custom-theme-styles';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    // 应用主题类名
    this.applyThemeToDOM(theme.className);
  }
}

// 导出单例实例
export const themeManager = ThemeManager.getInstance();