'use client';

import React, { useEffect, useState } from 'react';
import { themeManager } from '../../utils/themeManager';
import { applyThemeTransition } from '../../utils/themeUtils';
import { useI18n } from '../i18n/I18nProvider';
import ThemeMetaUpdater from './ThemeMetaUpdater';
import ThemeRestorer from './ThemeRestorer';
import ThemeIndicator from './ThemeIndicator';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme provider component
 * Responsible for initializing the theme system when the application starts
 */
export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { t } = useI18n();
  // Check if theme has been pre-loaded through script
  const [isThemeLoaded, setIsThemeLoaded] = useState(() => {
    // If body already has theme class or initialization mark, it means it has been pre-loaded
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
    // If theme has been pre-loaded, no need to initialize again
    if (isThemeLoaded) {
      console.log('Theme already pre-loaded, skipping initialization');
      return;
    }

    const initializeTheme = async () => {
      try {
        // Check CSS variables support
        if (!themeManager.isCSSVariablesSupported()) {
          console.warn('CSS variables not supported, theme system may not work properly');
        }

        // Add transition effects to body element
        if (document.body) {
          applyThemeTransition(document.body);
        }

        // Set timeout mechanism to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Theme loading timeout')), 3000);
        });

        // Load saved theme with timeout protection
        await Promise.race([
          themeManager.loadSavedTheme(),
          timeoutPromise
        ]);
        
        setIsThemeLoaded(true);
        console.log('Theme system initialized successfully');
      } catch (error) {
        console.error('Failed to initialize theme system:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        
        // Even if initialization fails, mark as loaded and use default theme
        setIsThemeLoaded(true);
      }
    };

    // If not pre-loaded, perform initialization
    const timeoutId = setTimeout(initializeTheme, 50);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isThemeLoaded]);

  // Listen to theme change events
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      console.log('Theme changed to:', event.detail.themeId);
      
      // Additional theme change processing logic can be added here
      // Such as notifying other components, recording analytics data, etc.
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);

  // 添加紧急回退机制
  useEffect(() => {
    if (!isThemeLoaded) {
      // If not loaded after 2 seconds, force mark as loaded
      const emergencyTimeout = setTimeout(() => {
        console.warn('Theme loading took too long, forcing completion');
        setIsThemeLoaded(true);
      }, 2000);

      return () => clearTimeout(emergencyTimeout);
    }
  }, [isThemeLoaded]);

  // If theme has not finished loading, show loading state
  if (!isThemeLoaded) {
    return (
      <div className="theme-loading">
        <div className="theme-loading-spinner">
          <div className="spinner"></div>
          <p>{t('Theme.ThemeProvider.loading', '正在加载主题...')}</p>
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

  // If there is an error, show error message (but still render child components)
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
 * Theme error boundary component
 * Catch theme-related errors to prevent the entire application from crashing
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
    
    // Try to reset to default theme
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