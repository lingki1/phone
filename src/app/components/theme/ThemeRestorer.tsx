'use client';

import { useEffect } from 'react';
import { themeManager } from '../../utils/themeManager';

/**
 * 主题恢复器
 * 在应用启动时恢复用户的主题设置
 */
export default function ThemeRestorer() {
  useEffect(() => {
    const restoreTheme = async () => {
      try {
        console.log('Starting theme restoration...');
        
        // 加载保存的主题
        await themeManager.loadSavedTheme();
        
        console.log('Theme restoration completed');
      } catch (error) {
        console.error('Failed to restore theme:', error);
        
        // 如果恢复失败，确保使用默认主题
        try {
          await themeManager.setTheme('default');
        } catch (fallbackError) {
          console.error('Failed to set default theme:', fallbackError);
        }
      }
    };

    // 延迟执行，确保DOM已经准备好
    const timeoutId = setTimeout(restoreTheme, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // 监听页面可见性变化，在页面重新可见时检查主题
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          // 页面重新可见时，重新加载主题（防止其他标签页修改了主题）
          await themeManager.loadSavedTheme();
        } catch (error) {
          console.warn('Failed to reload theme on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 监听存储变化，同步其他标签页的主题更改
  useEffect(() => {
    const handleStorageChange = async (event: StorageEvent) => {
      if (event.key === 'user-theme-settings' && event.newValue) {
        try {
          const settings = JSON.parse(event.newValue);
          if (settings.selectedTheme && settings.selectedTheme !== themeManager.getCurrentTheme()) {
            await themeManager.setTheme(settings.selectedTheme);
            console.log('Theme synchronized from other tab:', settings.selectedTheme);
          }
        } catch (error) {
          console.warn('Failed to sync theme from storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 这个组件不渲染任何内容
  return null;
}