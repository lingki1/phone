'use client';

import React, { useState, useEffect } from 'react';
import { Theme, CustomThemeColors } from '../../utils/themeManager';
import { themeManager } from '../../utils/themeManager';
import './CustomThemeEditor.css';

interface CustomThemeEditorProps {
  onSave: (theme: Theme) => void;
  onCancel: () => void;
  editingTheme?: Theme;
}

// 默认颜色配置
const DEFAULT_COLORS: CustomThemeColors = {
  // 背景色
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f9fa',
  bgTertiary: '#e9ecef',
  
  // 文本色
  textPrimary: '#1f1f1f',
  textSecondary: '#6c757d',
  textTertiary: '#adb5bd',
  
  // 强调色
  accentColor: '#007bff',
  accentHover: '#0056b3',
  
  // 边框色
  borderColor: '#dee2e6',
  borderLight: '#e9ecef',
  
  // 阴影
  shadowLight: '0 1px 3px rgba(0, 0, 0, 0.1)',
  shadowMedium: '0 2px 8px rgba(0, 0, 0, 0.15)',
  shadowHeavy: '0 4px 16px rgba(0, 0, 0, 0.2)',
  
  // 气泡样式
  bubbleStyle: {
    userBubble: {
      bg: '#007bff',
      text: '#ffffff',
      borderRadius: '18px 18px 4px 18px'
    },
    aiBubble: {
      bg: '#f8f9fa',
      text: '#1f1f1f',
      borderRadius: '18px 18px 18px 4px'
    }
  },
  
  // 特殊元素
  successColor: '#28a745',
  warningColor: '#ffc107',
  errorColor: '#dc3545',
  infoColor: '#17a2b8'
};

export default function CustomThemeEditor({ onSave, onCancel, editingTheme }: CustomThemeEditorProps) {
  const [themeName, setThemeName] = useState('');
  const [themeDescription, setThemeDescription] = useState('');
  const [colors, setColors] = useState<CustomThemeColors>(DEFAULT_COLORS);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 初始化编辑模式
  useEffect(() => {
    if (editingTheme) {
      setThemeName(editingTheme.name);
      setThemeDescription(editingTheme.description);
      if (editingTheme.customColors) {
        setColors(editingTheme.customColors);
      }
    }
  }, [editingTheme]);

  // 更新颜色配置
  const updateColor = (path: string, value: string) => {
    setColors(prev => {
      const newColors = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newColors;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
      
      return newColors;
    });
  };

  // 预览主题
  const handlePreview = () => {
    if (!themeName.trim()) {
      alert('请输入主题名称');
      return;
    }
    setIsPreviewMode(true);
  };

  // 取消预览
  const handleCancelPreview = () => {
    setIsPreviewMode(false);
  };

  // 保存主题
  const handleSave = async () => {
    if (!themeName.trim()) {
      alert('请输入主题名称');
      return;
    }

    setIsSaving(true);
    try {
      const themeId = editingTheme?.id || `custom-${Date.now()}`;
      const theme: Theme = {
        id: themeId,
        name: themeName,
        description: themeDescription,
        className: `theme-custom-${themeId}`,
        category: 'custom',
        isCustom: true,
        customColors: colors,
        preview: {
          primary: colors.bgPrimary,
          secondary: colors.bgSecondary,
          accent: colors.accentColor
        }
      };

      await themeManager.saveCustomTheme(theme);
      
      // 保存成功后，触发主题更新事件，让其他组件知道有新主题
      const event = new CustomEvent('customThemeSaved', {
        detail: { theme }
      });
      window.dispatchEvent(event);
      
      onSave(theme);
    } catch (error) {
      console.error('Failed to save custom theme:', error);
      alert('保存主题失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // 重置颜色
  const handleReset = () => {
    setColors(DEFAULT_COLORS);
  };

  return (
    <div className="groupmember-custom-theme-editor">
      <div className="groupmember-editor-container">
        <div className="groupmember-editor-header">
          <h2>{editingTheme ? '编辑自定义主题' : '创建自定义主题'}</h2>
          <div className="groupmember-editor-actions">
            <button 
              className="groupmember-preview-btn" 
              onClick={isPreviewMode ? handleCancelPreview : handlePreview}
              disabled={!themeName.trim()}
            >
              {isPreviewMode ? '取消预览' : '预览'}
            </button>
            <button className="groupmember-cancel-btn" onClick={onCancel}>取消</button>
            <button 
              className="groupmember-save-btn" 
              onClick={handleSave}
              disabled={isSaving || !themeName.trim()}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        <div className="groupmember-editor-content">
          {/* 预览区域 */}
          {isPreviewMode && (
            <div className="groupmember-preview-section">
              <h3>主题预览</h3>
              <div className="groupmember-preview-container">
                <div 
                  className="groupmember-preview-window"
                  style={{
                    '--preview-bg-primary': colors.bgPrimary,
                    '--preview-bg-secondary': colors.bgSecondary,
                    '--preview-bg-tertiary': colors.bgTertiary,
                    '--preview-text-primary': colors.textPrimary,
                    '--preview-text-secondary': colors.textSecondary,
                    '--preview-text-tertiary': colors.textTertiary,
                    '--preview-accent-color': colors.accentColor,
                    '--preview-accent-hover': colors.accentHover,
                    '--preview-border-color': colors.borderColor,
                    '--preview-border-light': colors.borderLight,
                    '--preview-shadow-light': colors.shadowLight,
                    '--preview-shadow-medium': colors.shadowMedium,
                    '--preview-shadow-heavy': colors.shadowHeavy,
                    '--preview-success-color': colors.successColor,
                    '--preview-warning-color': colors.warningColor,
                    '--preview-error-color': colors.errorColor,
                    '--preview-info-color': colors.infoColor,
                    '--preview-user-bubble-bg': colors.bubbleStyle.userBubble.bg,
                    '--preview-user-bubble-text': colors.bubbleStyle.userBubble.text,
                    '--preview-user-bubble-radius': colors.bubbleStyle.userBubble.borderRadius,
                    '--preview-ai-bubble-bg': colors.bubbleStyle.aiBubble.bg,
                    '--preview-ai-bubble-text': colors.bubbleStyle.aiBubble.text,
                    '--preview-ai-bubble-radius': colors.bubbleStyle.aiBubble.borderRadius,
                  } as React.CSSProperties}
                >
                  {/* 模拟聊天界面预览 */}
                  <div className="groupmember-preview-header">
                    <div className="groupmember-preview-avatar"></div>
                    <div className="groupmember-preview-info">
                      <div className="groupmember-preview-name">AI助手</div>
                      <div className="groupmember-preview-status">在线</div>
                    </div>
                  </div>
                  
                  <div className="groupmember-preview-messages">
                    <div className="groupmember-preview-message groupmember-preview-message-ai">
                      <div className="groupmember-preview-avatar-small"></div>
                      <div className="groupmember-preview-bubble groupmember-preview-bubble-ai">
                        你好！这是AI消息的预览效果
                      </div>
                    </div>
                    
                    <div className="groupmember-preview-message groupmember-preview-message-user">
                      <div className="groupmember-preview-bubble groupmember-preview-bubble-user">
                        这是用户消息的预览效果
                      </div>
                    </div>
                  </div>
                  
                  <div className="groupmember-preview-input">
                    <input type="text" placeholder="输入消息..." />
                    <button>发送</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 基本信息 */}
          <div className="groupmember-editor-section">
            <h3>基本信息</h3>
            <div className="groupmember-form-group">
              <label htmlFor="theme-name">主题名称</label>
              <input
                id="theme-name"
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="输入主题名称"
                maxLength={20}
              />
            </div>
            <div className="groupmember-form-group">
              <label htmlFor="theme-description">主题描述</label>
              <textarea
                id="theme-description"
                value={themeDescription}
                onChange={(e) => setThemeDescription(e.target.value)}
                placeholder="输入主题描述（可选）"
                maxLength={100}
                rows={2}
              />
            </div>
          </div>

          {/* 颜色配置 */}
          <div className="groupmember-editor-section">
            <div className="groupmember-section-header">
              <h3>颜色配置</h3>
              <button className="groupmember-reset-btn" onClick={handleReset}>重置</button>
            </div>

            {/* 背景色 */}
            <div className="groupmember-color-group">
              <h4>背景色</h4>
              <div className="groupmember-color-grid">
                <div className="groupmember-color-item">
                  <label>主背景</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.bgPrimary}
                      onChange={(e) => updateColor('bgPrimary', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.bgPrimary}
                      onChange={(e) => updateColor('bgPrimary', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
                <div className="groupmember-color-item">
                  <label>次背景</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.bgSecondary}
                      onChange={(e) => updateColor('bgSecondary', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.bgSecondary}
                      onChange={(e) => updateColor('bgSecondary', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
                <div className="groupmember-color-item">
                  <label>第三背景</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.bgTertiary}
                      onChange={(e) => updateColor('bgTertiary', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.bgTertiary}
                      onChange={(e) => updateColor('bgTertiary', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 文本色 */}
            <div className="groupmember-color-group">
              <h4>文本色</h4>
              <div className="groupmember-color-grid">
                <div className="groupmember-color-item">
                  <label>主文本</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.textPrimary}
                      onChange={(e) => updateColor('textPrimary', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.textPrimary}
                      onChange={(e) => updateColor('textPrimary', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
                <div className="groupmember-color-item">
                  <label>次文本</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.textSecondary}
                      onChange={(e) => updateColor('textSecondary', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.textSecondary}
                      onChange={(e) => updateColor('textSecondary', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
                <div className="groupmember-color-item">
                  <label>第三文本</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.textTertiary}
                      onChange={(e) => updateColor('textTertiary', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.textTertiary}
                      onChange={(e) => updateColor('textTertiary', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 强调色 */}
            <div className="groupmember-color-group">
              <h4>强调色</h4>
              <div className="groupmember-color-grid">
                <div className="groupmember-color-item">
                  <label>主强调色</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.accentColor}
                      onChange={(e) => updateColor('accentColor', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.accentColor}
                      onChange={(e) => updateColor('accentColor', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
                <div className="groupmember-color-item">
                  <label>强调色悬停</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.accentHover}
                      onChange={(e) => updateColor('accentHover', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.accentHover}
                      onChange={(e) => updateColor('accentHover', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 气泡样式 */}
            <div className="groupmember-color-group">
              <h4>气泡样式</h4>
              <div className="groupmember-bubble-style-group">
                <div className="groupmember-bubble-style-item">
                  <h5>用户气泡</h5>
                  <div className="groupmember-color-grid">
                    <div className="groupmember-color-item">
                      <label>背景色</label>
                      <div className="groupmember-color-input-group">
                        <input
                          type="color"
                          value={colors.bubbleStyle.userBubble.bg}
                          onChange={(e) => updateColor('bubbleStyle.userBubble.bg', e.target.value)}
                        />
                        <input
                          type="text"
                          value={colors.bubbleStyle.userBubble.bg}
                          onChange={(e) => updateColor('bubbleStyle.userBubble.bg', e.target.value)}
                          className="groupmember-color-text"
                        />
                      </div>
                    </div>
                    <div className="groupmember-color-item">
                      <label>文字色</label>
                      <div className="groupmember-color-input-group">
                        <input
                          type="color"
                          value={colors.bubbleStyle.userBubble.text}
                          onChange={(e) => updateColor('bubbleStyle.userBubble.text', e.target.value)}
                        />
                        <input
                          type="text"
                          value={colors.bubbleStyle.userBubble.text}
                          onChange={(e) => updateColor('bubbleStyle.userBubble.text', e.target.value)}
                          className="groupmember-color-text"
                        />
                      </div>
                    </div>
                    <div className="groupmember-color-item">
                      <label>圆角样式</label>
                      <select
                        value={colors.bubbleStyle.userBubble.borderRadius}
                        onChange={(e) => updateColor('bubbleStyle.userBubble.borderRadius', e.target.value)}
                      >
                        <option value="18px 18px 4px 18px">标准圆角</option>
                        <option value="18px">全圆角</option>
                        <option value="8px">小圆角</option>
                        <option value="4px">直角</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="groupmember-bubble-style-item">
                  <h5>AI气泡</h5>
                  <div className="groupmember-color-grid">
                    <div className="groupmember-color-item">
                      <label>背景色</label>
                      <div className="groupmember-color-input-group">
                        <input
                          type="color"
                          value={colors.bubbleStyle.aiBubble.bg}
                          onChange={(e) => updateColor('bubbleStyle.aiBubble.bg', e.target.value)}
                        />
                        <input
                          type="text"
                          value={colors.bubbleStyle.aiBubble.bg}
                          onChange={(e) => updateColor('bubbleStyle.aiBubble.bg', e.target.value)}
                          className="groupmember-color-text"
                        />
                      </div>
                    </div>
                    <div className="groupmember-color-item">
                      <label>文字色</label>
                      <div className="groupmember-color-input-group">
                        <input
                          type="color"
                          value={colors.bubbleStyle.aiBubble.text}
                          onChange={(e) => updateColor('bubbleStyle.aiBubble.text', e.target.value)}
                        />
                        <input
                          type="text"
                          value={colors.bubbleStyle.aiBubble.text}
                          onChange={(e) => updateColor('bubbleStyle.aiBubble.text', e.target.value)}
                          className="groupmember-color-text"
                        />
                      </div>
                    </div>
                    <div className="groupmember-color-item">
                      <label>圆角样式</label>
                      <select
                        value={colors.bubbleStyle.aiBubble.borderRadius}
                        onChange={(e) => updateColor('bubbleStyle.aiBubble.borderRadius', e.target.value)}
                      >
                        <option value="18px 18px 18px 4px">标准圆角</option>
                        <option value="18px">全圆角</option>
                        <option value="8px">小圆角</option>
                        <option value="4px">直角</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 特殊颜色 */}
            <div className="groupmember-color-group">
              <h4>特殊颜色</h4>
              <div className="groupmember-color-grid">
                <div className="groupmember-color-item">
                  <label>成功色</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.successColor}
                      onChange={(e) => updateColor('successColor', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.successColor}
                      onChange={(e) => updateColor('successColor', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
                <div className="groupmember-color-item">
                  <label>警告色</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.warningColor}
                      onChange={(e) => updateColor('warningColor', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.warningColor}
                      onChange={(e) => updateColor('warningColor', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
                <div className="groupmember-color-item">
                  <label>错误色</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.errorColor}
                      onChange={(e) => updateColor('errorColor', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.errorColor}
                      onChange={(e) => updateColor('errorColor', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
                <div className="groupmember-color-item">
                  <label>信息色</label>
                  <div className="groupmember-color-input-group">
                    <input
                      type="color"
                      value={colors.infoColor}
                      onChange={(e) => updateColor('infoColor', e.target.value)}
                    />
                    <input
                      type="text"
                      value={colors.infoColor}
                      onChange={(e) => updateColor('infoColor', e.target.value)}
                      className="groupmember-color-text"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
