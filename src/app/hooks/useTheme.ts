'use client';

import { useState, useEffect, useCallback } from 'react';
import { themeManager } from '../utils/themeManager';
import { Theme, ThemeChangeEvent } from '../types/theme';

export interface UseThemeReturn {
  currentTheme: string;
  currentThemeObject: Theme | undefined;
  availableThemes: Theme[];
  isLoading: boolean;
  setTheme: (themeId: string) => Promise<void>;
  previewTheme: (themeId: string) => void;
  cancelPreview: () => void;
  getThemesByCategory: (category: string) => Theme[];
  categories: Array<{id: string, name: string}>;
}

/**
 * 主题管理Hook
 * 提供主题相关的状态和操作方法
 */
export function useTheme(): UseThemeReturn {
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 获取当前主题对象
  const currentThemeObject = themeManager.getThemeById(currentTheme);
  
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
  const previewTheme = useCallback((themeId: string) => {
    themeManager.previewTheme(themeId);
  }, []);

  /**
   * 取消预览
   */
  const cancelPreview = useCallback(() => {
    themeManager.cancelPreview();
  }, []);

  /**
   * 根据分类获取主题
   */
  const getThemesByCategory = useCallback((category: string) => {
    return themeManager.getThemesByCategory(category);
  }, []);

  /**
   * 处理主题变更事件
   */
  const handleThemeChange = useCallback((event: ThemeChangeEvent) => {
    setCurrentTheme(event.detail.themeId);
  }, []);

  // 初始化主题
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        setIsLoading(true);
        await themeManager.loadSavedTheme();
        setCurrentTheme(themeManager.getCurrentTheme());
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        // 初始化失败时使用默认主题
        setCurrentTheme('default');
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, []);

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
    isLoading,
    setTheme,
    previewTheme,
    cancelPreview,
    getThemesByCategory,
    categories
  };
}

/**
 * 简化版主题Hook，只提供当前主题信息
 */
export function useCurrentTheme(): {
  currentTheme: string;
  currentThemeObject: Theme | undefined;
  isLoading: boolean;
} {
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const currentThemeObject = themeManager.getThemeById(currentTheme);

  useEffect(() => {
    const initializeTheme = async () => {
      try {
        setIsLoading(true);
        await themeManager.loadSavedTheme();
        setCurrentTheme(themeManager.getCurrentTheme());
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        setCurrentTheme('default');
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();

    const handleThemeChange = (event: Event) => {
      const themeEvent = event as ThemeChangeEvent;
      setCurrentTheme(themeEvent.detail.themeId);
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