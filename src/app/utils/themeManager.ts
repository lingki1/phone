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
  category: 'basic' | 'gender' | 'style' | 'nature';
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    gradient?: string;
  };
}

// 用户主题设置接口
export interface UserThemeSettings {
  selectedTheme: string;
  lastUpdated: number;
}

// 可用主题列表
export const AVAILABLE_THEMES: Theme[] = [
  {
    id: 'default',
    name: '默认白色',
    description: '简洁清爽的白色主题',
    className: '',
    category: 'basic',
    preview: { primary: '#ffffff', secondary: '#f8f9fa', accent: '#007bff' }
  },
  {
    id: 'dark',
    name: '深色模式',
    description: '护眼的深色主题',
    className: 'theme-dark',
    category: 'basic',
    preview: { primary: '#1a1a1a', secondary: '#2d2d2d', accent: '#4dabf7' }
  },
  {
    id: 'masculine',
    name: '男性风格',
    description: '深蓝商务风格，稳重大气',
    className: 'theme-masculine',
    category: 'gender',
    preview: { primary: '#0f1419', secondary: '#1a2332', accent: '#00d4ff' }
  },
  {
    id: 'feminine',
    name: '女性风格',
    description: '粉色温柔风格，优雅浪漫',
    className: 'theme-feminine',
    category: 'gender',
    preview: { primary: '#fdf2f8', secondary: '#fce7f3', accent: '#f472b6' }
  },
  {
    id: 'anime',
    name: '二次元',
    description: '紫色梦幻风格，充满想象',
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
    name: '可爱风格',
    description: '橙色活泼风格，青春可爱',
    className: 'theme-cute',
    category: 'style',
    preview: { primary: '#fff7ed', secondary: '#ffedd5', accent: '#ff8c42' }
  },
  {
    id: 'metal',
    name: '金属风格',
    description: '银灰科技风格，现代简约',
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
    name: '森林主题',
    description: '绿色自然风格，清新自然',
    className: 'theme-forest',
    category: 'nature',
    preview: { primary: '#f0fdf4', secondary: '#dcfce7', accent: '#16a34a' }
  },
  {
    id: 'ocean',
    name: '海洋主题',
    description: '蓝绿渐变风格，宁静深邃',
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
    name: '夕阳主题',
    description: '橙红渐变风格，温暖浪漫',
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
    name: '极简主题',
    description: '黑白简约风格，纯净优雅',
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
  public getThemeById(id: string): Theme | undefined {
    return AVAILABLE_THEMES.find(theme => theme.id === id);
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
      
      const theme = this.getThemeById(themeId);
      if (!theme) {
        console.warn(`Theme with id "${themeId}" not found, falling back to default`);
        themeId = 'default';
      }

      // 添加短暂延迟，让用户看到加载状态
      await new Promise(resolve => setTimeout(resolve, 300));

      // 应用主题到DOM
      this.applyThemeToDOM(theme?.className || '');
      
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
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 主题切换失败状态
      themeStateManager.failThemeChange(errorMessage);
      hideThemeLoading();
      
      console.error('Failed to set theme:', error);
      showThemeError(`主题切换失败: ${errorMessage}`);
      
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
      const theme = this.getThemeById(themeId);
      if (!theme) {
        console.warn(`Theme with id "${themeId}" not found, falling back to default`);
        themeId = 'default';
      }

      // 直接应用主题到DOM，不显示加载状态
      this.applyThemeToDOM(theme?.className || '');
      
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
  public previewTheme(themeId: string): void {
    const theme = this.getThemeById(themeId);
    if (theme) {
      themeStateManager.startPreview(themeId);
      this.applyThemeToDOM(theme.className);
    }
  }

  /**
   * 取消预览，恢复当前主题
   */
  public cancelPreview(): void {
    themeStateManager.endPreview();
    const currentTheme = this.getThemeById(this.currentTheme);
    if (currentTheme) {
      this.applyThemeToDOM(currentTheme.className);
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
      { id: 'basic', name: '基础主题' },
      { id: 'gender', name: '性别风格' },
      { id: 'style', name: '个性风格' },
      { id: 'nature', name: '自然主题' }
    ];
  }
}

// 导出单例实例
export const themeManager = ThemeManager.getInstance();