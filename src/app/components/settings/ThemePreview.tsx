'use client';

import React from 'react';
import { Theme } from '../../types/theme';
import { generateThemePreviewStyle } from '../../utils/themeUtils';
import { useI18n } from '../i18n/I18nProvider';
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
  const { t } = useI18n();
  const handleClick = () => {
    if (!isSelected) {
      onSelect(theme.id);
    }
  };

  const previewStyle = generateThemePreviewStyle(theme);
  
  // Generate special preview style for custom themes
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
      {/* Theme preview card */}
      <div className="theme-card" style={getCustomThemePreviewStyle()}>
        {/* Mock chat interface */}
        <div className="mock-chat-interface">
          {/* Mock header */}
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
              {t('Settings.ThemePreview.mockChatTitle', '聊天示例')}
            </div>
          </div>

          {/* Mock messages */}
          <div className="mock-messages">
            <div className="mock-message ai-message">
              <div className="mock-message-bubble" style={{
                backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.aiBubble.bg : theme.preview.secondary,
                color: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.aiBubble.text : (theme.preview.primary === '#ffffff' ? '#1f1f1f' : '#ffffff'),
                borderRadius: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.aiBubble.borderRadius : '18px 18px 18px 4px'
              }}>
                {t('Settings.ThemePreview.mockAiMessage', '你好！这是 {{themeName}} 主题').replace('{{themeName}}', theme.name)}
              </div>
            </div>
            <div className="mock-message user-message">
              <div className="mock-message-bubble" style={{
                backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.userBubble.bg : (theme.preview.gradient || theme.preview.accent),
                color: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.userBubble.text : '#ffffff',
                borderRadius: theme.isCustom && theme.customColors ? theme.customColors.bubbleStyle.userBubble.borderRadius : '18px 18px 4px 18px'
              }}>
                {t('Settings.ThemePreview.mockUserMessage', '看起来很不错！')}
              </div>
            </div>
          </div>

          {/* Mock input */}
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

        {/* Selected indicator */}
        {isSelected && (
          <div className="selected-indicator">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}


      </div>

      {/* Theme information */}
      <div className="theme-info">
        <div className="theme-name">{theme.name}</div>
        <div className="theme-description">{theme.description}</div>
        
        {/* Color preview */}
        <div className="color-palette">
          <div 
            className="color-dot primary" 
            style={{ backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bgPrimary : theme.preview.primary }}
            title={t('Settings.ThemePreview.colorTooltips.primary', '主背景色')}
          ></div>
          <div 
            className="color-dot secondary" 
            style={{ backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.bgSecondary : theme.preview.secondary }}
            title={t('Settings.ThemePreview.colorTooltips.secondary', '次背景色')}
          ></div>
          <div 
            className="color-dot accent" 
            style={{ 
              backgroundColor: theme.isCustom && theme.customColors ? theme.customColors.accentColor : (theme.preview.gradient || theme.preview.accent)
            }}
            title={t('Settings.ThemePreview.colorTooltips.accent', '强调色')}
          ></div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="theme-actions">
        {isSelected ? (
          <div className="current-theme-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('Settings.ThemePreview.currentTheme', '当前主题')}</span>
          </div>
        ) : (
          <button 
            className="apply-theme-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(theme.id);
            }}
          >
            {t('Settings.ThemePreview.apply', '应用')}
          </button>
        )}
      </div>
    </div>
  );
}