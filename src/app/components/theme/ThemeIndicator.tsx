'use client';

import React, { useState, useEffect } from 'react';
import { themeStateManager, ThemeState } from '../../utils/themeStateManager';
import { AVAILABLE_THEMES } from '../../utils/themeManager';
import { useI18n } from '../i18n/I18nProvider';
import './ThemeIndicator.css';

/**
 * Theme switching indicator
 * Display theme switching status and preview information
 */
export default function ThemeIndicator() {
  const { t } = useI18n();
  const [state, setState] = useState<ThemeState>(themeStateManager.getState());

  useEffect(() => {
    const unsubscribe = themeStateManager.subscribe(setState);
    return unsubscribe;
  }, []);

  // If there is no state to display, do not render the component
  if (!state.isLoading && !state.isPreviewMode && !state.error) {
    return null;
  }

  const previewTheme = state.previewThemeId 
    ? AVAILABLE_THEMES.find(t => t.id === state.previewThemeId)
    : null;

  return (
    <div className="theme-indicator-container">
      {/* 加载指示器 */}
      {state.isLoading && (
        <div className="theme-loading-indicator">
          <div className="loading-spinner"></div>
          <span className="loading-text">{t('Theme.ThemeIndicator.loading', '正在切换主题...')}</span>
        </div>
      )}

      {/* 预览指示器 */}
      {state.isPreviewMode && previewTheme && (
        <div className="theme-preview-indicator">
          <div className="preview-icon">👀</div>
          <div className="preview-content">
            <div className="preview-title">{t('Theme.ThemeIndicator.preview.title', '预览模式')}</div>
            <div className="preview-theme-name">{previewTheme.name}</div>
          </div>
          <div className="preview-actions">
            <button 
              className="preview-apply-btn"
              onClick={() => {
                // 这里需要触发主题应用
                window.dispatchEvent(new CustomEvent('applyPreviewTheme', {
                  detail: { themeId: state.previewThemeId }
                }));
              }}
            >
              {t('Theme.ThemeIndicator.preview.apply', '应用')}
            </button>
            <button 
              className="preview-cancel-btn"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('cancelPreviewTheme'));
              }}
            >
              {t('Theme.ThemeIndicator.preview.cancel', '取消')}
            </button>
          </div>
        </div>
      )}

      {/* 错误指示器 */}
      {state.error && (
        <div className="theme-error-indicator">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <div className="error-title">{t('Theme.ThemeIndicator.error.title', '主题切换失败')}</div>
            <div className="error-message">{state.error}</div>
          </div>
          <button 
            className="error-close-btn"
            onClick={() => themeStateManager.clearError()}
          >
            ×
          </button>
        </div>
      )}

      {/* 过渡遮罩 */}
      {state.isTransitioning && (
        <div className="theme-transition-overlay">
          <div className="transition-content">
            <div className="transition-spinner"></div>
            <div className="transition-text">{t('Theme.ThemeIndicator.transition', '主题切换中...')}</div>
          </div>
        </div>
      )}
    </div>
  );
}