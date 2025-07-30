'use client';

import React, { useEffect, useState } from 'react';
import { themeManager } from '../../utils/themeManager';
import { applyThemeTransition } from '../../utils/themeUtils';
import ThemeMetaUpdater from './ThemeMetaUpdater';
import ThemeRestorer from './ThemeRestorer';
import ThemeIndicator from './ThemeIndicator';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * 主题提供者组件
 * 负责在应用启动时初始化主题系统
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  // 检查是否已经通过脚本预加载了主题
  const [isThemeLoaded, setIsThemeLoaded] = useState(() => {
    // 如果body已经有主题类或初始化标记，说明已经预加载了
    if (typeof window !== 'undefined' && document.body) {
      const hasThemeClass = Array.from(document.body.classList).some(cls => 
        cls.startsWith('theme-') || cls === 'theme-initialized'
      );
      return hasThemeClass;
    }
    return false;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 如果已经预加载了主题，就不需要再初始化
    if (isThemeLoaded) {
      console.log('Theme already pre-loaded, skipping initialization');
      return;
    }

    const initializeTheme = async () => {
      try {
        // 检查CSS变量支持
        if (!themeManager.isCSSVariablesSupported()) {
          console.warn('CSS variables not supported, theme system may not work properly');
        }

        // 为body元素添加过渡效果
        if (document.body) {
          applyThemeTransition(document.body);
        }

        // 设置超时机制，防止无限加载
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Theme loading timeout')), 3000);
        });

        // 加载保存的主题，带超时保护
        await Promise.race([
          themeManager.loadSavedTheme(),
          timeoutPromise
        ]);
        
        setIsThemeLoaded(true);
        console.log('Theme system initialized successfully');
      } catch (error) {
        console.error('Failed to initialize theme system:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        
        // 即使初始化失败，也要标记为已加载，使用默认主题
        setIsThemeLoaded(true);
      }
    };

    // 如果没有预加载，则进行初始化
    const timeoutId = setTimeout(initializeTheme, 50);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isThemeLoaded]);

  // 监听主题变更事件
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      console.log('Theme changed to:', event.detail.themeId);
      
      // 可以在这里添加主题变更的额外处理逻辑
      // 比如通知其他组件、记录分析数据等
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);

  // 添加紧急回退机制
  useEffect(() => {
    if (!isThemeLoaded) {
      // 如果2秒后还没加载完成，强制标记为已加载
      const emergencyTimeout = setTimeout(() => {
        console.warn('Theme loading took too long, forcing completion');
        setIsThemeLoaded(true);
      }, 2000);

      return () => clearTimeout(emergencyTimeout);
    }
  }, [isThemeLoaded]);

  // 如果主题还未加载完成，显示加载状态
  if (!isThemeLoaded) {
    return (
      <div className="theme-loading">
        <div className="theme-loading-spinner">
          <div className="spinner"></div>
          <p>正在加载主题...</p>
        </div>
        <style jsx>{`
          .theme-loading {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #ffffff;
            z-index: 9999;
          }
          
          .theme-loading-spinner {
            text-align: center;
            color: #666;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 16px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          p {
            margin: 0;
            font-size: 14px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
        `}</style>
      </div>
    );
  }

  // 如果有错误，显示错误信息（但仍然渲染子组件）
  if (error) {
    console.warn('Theme system error:', error);
  }

  return (
    <>
      <ThemeRestorer />
      <ThemeMetaUpdater />
      <ThemeIndicator />
      {children}
    </>
  );
}

/**
 * 主题错误边界组件
 * 捕获主题相关的错误，防止整个应用崩溃
 */
export class ThemeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Theme system error:', error, errorInfo);
    
    // 尝试重置到默认主题
    try {
      themeManager.setTheme('default');
    } catch (resetError) {
      console.error('Failed to reset to default theme:', resetError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="theme-error">
          <h2>主题系统出现错误</h2>
          <p>已自动切换到默认主题，请刷新页面重试。</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '16px'
            }}
          >
            刷新页面
          </button>
          <style jsx>{`
            .theme-error {
              padding: 20px;
              text-align: center;
              color: #666;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            
            h2 {
              color: #dc3545;
              margin-bottom: 16px;
            }
            
            p {
              margin-bottom: 0;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}