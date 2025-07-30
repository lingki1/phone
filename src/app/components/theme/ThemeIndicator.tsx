'use client';

import React, { useState, useEffect } from 'react';
import { themeStateManager, ThemeState } from '../../utils/themeStateManager';
import { AVAILABLE_THEMES } from '../../utils/themeManager';
import './ThemeIndicator.css';

/**
 * 主题切换指示器
 * 显示主题切换状态和预览信息
 */
export default function ThemeIndicator() {
  const [state, setState] = useState<ThemeState>(themeStateManager.getState());

  useEffect(() => {
    const unsubscribe = themeStateManager.subscribe(setState);
    return unsubscribe;
  }, []);

  // 如果没有任何状态需要显示，不渲染组件
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
          <span className="loading-text">正在切换主题...</span>
        </div>
      )}

      {/* 预览指示器 */}
      {state.isPreviewMode && previewTheme && (
        <div className="theme-preview-indicator">
          <div className="preview-icon">👀</div>
          <div className="preview-content">
            <div className="preview-title">预览模式</div>
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
              应用
            </button>
            <button 
              className="preview-cancel-btn"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('cancelPreviewTheme'));
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 错误指示器 */}
      {state.error && (
        <div className="theme-error-indicator">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <div className="error-title">主题切换失败</div>
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
            <div className="transition-text">主题切换中...</div>
          </div>
        </div>
      )}
    </div>
  );
}