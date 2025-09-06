'use client';

import React from 'react';
import { Theme } from '../../types/theme';
import { generateThemePreviewStyle } from '../../utils/themeUtils';
import './ThemePreview.css';

interface ThemePreviewProps {
  theme: Theme;
  isSelected: boolean;
  isPreview: boolean;
  onSelect: (themeId: string) => void;
  onPreview: (themeId: string) => void;
  onPreviewEnd?: () => void;
}

export default function ThemePreview({
  theme,
  isSelected,
  onSelect
}: ThemePreviewProps) {
  const handleClick = () => {
    if (!isSelected) {
      onSelect(theme.id);
    }
  };

  const previewStyle = generateThemePreviewStyle(theme);
  
  // 为自定义主题生成特殊的预览样式
  const getCustomThemePreviewStyle = () => {
    if (theme.isCustom && theme.customColors) {
      return {
        backgroundColor: theme.customColors.bgPrimary,
        color: theme.customColors.textPrimary,
        border: `2px solid ${theme.customColors.borderColor}`,
        boxShadow: `0 2px 8px ${theme.customColors.shadowMedium}`,
      };
    }
    return previewStyle;
  };

  return (
    <div
      className={`theme-preview ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      {/* 主题预览卡片 */}
      <div className="theme-card" style={getCustomThemePreviewStyle()}>
        {/* 模拟聊天界面 */}
        <div className="mock-chat-interface">
          {/* 模拟头部 */}
          <div className="mock-header" style={{
            backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bgSecondary : theme.preview.secondary,
            borderBottomColor: (theme.isCustom && theme.customColors ? theme.customColors.accentColor : theme.preview.accent) + '33'
          }}>
            <div className="mock-avatar" style={{
              backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.accentColor : theme.preview.accent
            }}></div>
            <div className="mock-title" style={{
              color: theme.isCustom && theme.customColors ? theme.customColors.textPrimary : (theme.preview.primary === '#ffffff' ? '#1f1f1f' : '#ffffff')
            }}>
              聊天示例
            </div>
          </div>

          {/* 模拟消息 */}
          <div className="mock-messages">
            <div className="mock-message ai-message">
              <div className="mock-message-bubble" style={{
                backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.aiBubble.bg : theme.preview.secondary,
                color: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.aiBubble.text : (theme.preview.primary === '#ffffff' ? '#1f1f1f' : '#ffffff'),
                borderRadius: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.aiBubble.borderRadius : '18px 18px 18px 4px'
              }}>
                你好！这是 {theme.name} 主题
              </div>
            </div>
            <div className="mock-message user-message">
              <div className="mock-message-bubble" style={{
                backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.userBubble.bg : (theme.preview.gradient || theme.preview.accent),
                color: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.userBubble.text : '#ffffff',
                borderRadius: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.userBubble.borderRadius : '18px 18px 4px 18px'
              }}>
                看起来很不错！
              </div>
            </div>
          </div>

          {/* 模拟输入框 */}
          <div className="mock-input" style={{
            backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bgSecondary : theme.preview.secondary,
            borderTopColor: (theme.isCustom && theme.customColors ? theme.customColors.accentColor : theme.preview.accent) + '33'
          }}>
            <div className="mock-input-field" style={{
              backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bgPrimary : theme.preview.primary,
              borderColor: (theme.isCustom && theme.customColors ? theme.customColors.accentColor : theme.preview.accent) + '66'
            }}></div>
          </div>
        </div>

        {/* 选中指示器 */}
        {isSelected && (
          <div className="selected-indicator">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}


      </div>

      {/* 主题信息 */}
      <div className="theme-info">
        <div className="theme-name">{theme.name}</div>
        <div className="theme-description">{theme.description}</div>
        
        {/* 颜色预览 */}
        <div className="color-palette">
          <div 
            className="color-dot primary" 
            style={{ backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bgPrimary : theme.preview.primary }}
            title="主背景色"
          ></div>
          <div 
            className="color-dot secondary" 
            style={{ backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bgSecondary : theme.preview.secondary }}
            title="次背景色"
          ></div>
          <div 
            className="color-dot accent" 
            style={{ 
              backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.accentColor : (theme.preview.gradient || theme.preview.accent)
            }}
            title="强调色"
          ></div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="theme-actions">
        {isSelected ? (
          <div className="current-theme-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>当前主题</span>
          </div>
        ) : (
          <button 
            className="apply-theme-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(theme.id);
            }}
          >
            应用
          </button>
        )}
      </div>
    </div>
  );
}