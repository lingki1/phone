'use client';

import { useState, useEffect, useCallback } from 'react';
import { themeManager } from '../utils/themeManager';
import { ThemeChangeEvent } from '../types/theme';
import { Theme as ThemeManagerTheme } from '../utils/themeManager';

export interface UseThemeReturn {
  currentTheme: string;
  currentThemeObject: ThemeManagerTheme | undefined;
  availableThemes: ThemeManagerTheme[];
  allThemes: ThemeManagerTheme[];
  isLoading: boolean;
  setTheme: (themeId: string) => Promise<void>;
  previewTheme: (themeId: string) => Promise<void>;
  cancelPreview: () => Promise<void>;
  getThemesByCategory: (category: string) => ThemeManagerTheme[];
  categories: Array<{id: string, name: string}>;
  refreshThemes: () => Promise<void>;
}

/**
 * 主题管理Hook
 * 提供主题相关的状态和操作方法
 */
export function useTheme(): UseThemeReturn {
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allThemes, setAllThemes] = useState<ThemeManagerTheme[]>([]);

  // 获取当前主题对象
  const [currentThemeObject, setCurrentThemeObject] = useState<ThemeManagerTheme | undefined>(undefined);
  
  // 获取所有可用主题
  const availableThemes = themeManager.getAvailableThemes();
  
  // 获取主题分类
  const categories = themeManager.getCategories();

  /**
   * 设置主题
   */
  const setTheme = useCallback(async (themeId: string) => {
    try {
      setIsLoading(true);
      await themeManager.setTheme(themeId);
      setCurrentTheme(themeId);
    } catch (error) {
      console.error('Failed to set theme:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 预览主题
   */
  const previewTheme = useCallback(async (themeId: string) => {
    await themeManager.previewTheme(themeId);
  }, []);

  /**
   * 取消预览
   */
  const cancelPreview = useCallback(async () => {
    await themeManager.cancelPreview();
  }, []);

  /**
   * 根据分类获取主题
   */
  const getThemesByCategory = useCallback((category: string) => {
    return allThemes.filter(theme => theme.category === category);
  }, [allThemes]);

  /**
   * 刷新主题列表
   */
  const refreshThemes = useCallback(async () => {
    try {
      const themes = await themeManager.getAllThemes();
      setAllThemes(themes);
    } catch (error) {
      console.error('Failed to refresh themes:', error);
    }
  }, []);

  /**
   * 处理主题变更事件
   */
  const handleThemeChange = useCallback(async (event: ThemeChangeEvent) => {
    setCurrentTheme(event.detail.themeId);
    // 更新当前主题对象
    const theme = await themeManager.getThemeById(event.detail.themeId);
    setCurrentThemeObject(theme);
  }, []);

  // 初始化主题
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        setIsLoading(true);
        await themeManager.loadSavedTheme();
        const currentThemeId = themeManager.getCurrentTheme();
        setCurrentTheme(currentThemeId);
        
        // 加载所有主题
        const themes = await themeManager.getAllThemes();
        setAllThemes(themes);
        
        // 获取当前主题对象
        const currentThemeObj = await themeManager.getThemeById(currentThemeId);
        setCurrentThemeObject(currentThemeObj);
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        // 初始化失败时使用默认主题
        setCurrentTheme('default');
        setAllThemes(availableThemes);
        setCurrentThemeObject(availableThemes.find(t => t.id === 'default'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, [availableThemes]);

  // 监听主题变更事件
  useEffect(() => {
    const handleThemeChangeEvent = (event: Event) => {
      handleThemeChange(event as ThemeChangeEvent);
    };

    window.addEventListener('themeChanged', handleThemeChangeEvent);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChangeEvent);
    };
  }, [handleThemeChange]);

  return {
    currentTheme,
    currentThemeObject,
    availableThemes,
    allThemes,
    isLoading,
    setTheme,
    previewTheme,
    cancelPreview,
    getThemesByCategory,
    categories,
    refreshThemes
  };
}

/**
 * 简化版主题Hook，只提供当前主题信息
 */
export function useCurrentTheme(): {
  currentTheme: string;
  currentThemeObject: ThemeManagerTheme | undefined;
  isLoading: boolean;
} {
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentThemeObject, setCurrentThemeObject] = useState<ThemeManagerTheme | undefined>(undefined);

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        setIsLoading(true);
        await themeManager.loadSavedTheme();
        const currentThemeId = themeManager.getCurrentTheme();
        setCurrentTheme(currentThemeId);
        
        // 获取当前主题对象
        const currentThemeObj = await themeManager.getThemeById(currentThemeId);
        setCurrentThemeObject(currentThemeObj);
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        setCurrentTheme('default');
        setCurrentThemeObject(themeManager.getAvailableThemes().find(t => t.id === 'default'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();

    const handleThemeChange = async (event: Event) => {
      const themeEvent = event as ThemeChangeEvent;
      setCurrentTheme(themeEvent.detail.themeId);
      
      // 更新当前主题对象
      const theme = await themeManager.getThemeById(themeEvent.detail.themeId);
      setCurrentThemeObject(theme);
    };

    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return {
    currentTheme,
    currentThemeObject,
    isLoading
  };
}