'use client';

import React, { useState } from 'react';
import { DiscoverSettings } from '../../types/discover';
import './DiscoverSettingsPanel.css';

interface DiscoverSettingsPanelProps {
  settings: DiscoverSettings;
  onSave: (settings: DiscoverSettings) => void;
  onCancel: () => void;
}

export default function DiscoverSettingsPanel({ 
  settings, 
  onSave, 
  onCancel 
}: DiscoverSettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<DiscoverSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof DiscoverSettings>(
    key: K, 
    value: DiscoverSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="settings-panel-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <button 
            className="settings-cancel-btn"
            onClick={onCancel}
            disabled={isSaving}
          >
            取消
          </button>
          <h2 className="settings-title">动态设置</h2>
          <button 
            className="settings-save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>

        <div className="settings-content">
          {/* AI自动生成设置 */}
          <div className="settings-section">
            <h3 className="settings-section-title">AI自动生成</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>自动生成AI动态</span>
                <span className="setting-description">AI角色会自动发布动态</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localSettings.autoGeneratePosts}
                  onChange={(e) => updateSetting('autoGeneratePosts', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {localSettings.autoGeneratePosts && (
              <div className="setting-item">
                <div className="setting-label">
                  <span>生成间隔（分钟）</span>
                  <span className="setting-description">AI动态生成的时间间隔</span>
                </div>
                <input
                  type="number"
                  min="30"
                  max="1440"
                  value={localSettings.autoGenerateInterval}
                  onChange={(e) => updateSetting('autoGenerateInterval', parseInt(e.target.value) || 60)}
                  className="setting-input"
                />
              </div>
            )}

            <div className="setting-item">
              <div className="setting-label">
                <span>每日最大动态数</span>
                <span className="setting-description">限制每日发布的动态数量</span>
              </div>
              <input
                type="number"
                min="1"
                max="50"
                value={localSettings.maxPostsPerDay}
                onChange={(e) => updateSetting('maxPostsPerDay', parseInt(e.target.value) || 10)}
                className="setting-input"
              />
            </div>
          </div>

          {/* AI互动设置 */}
          <div className="settings-section">
            <h3 className="settings-section-title">AI互动</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>允许AI评论</span>
                <span className="setting-description">AI角色可以对动态进行评论</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localSettings.allowAiComments}
                  onChange={(e) => updateSetting('allowAiComments', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>允许AI点赞</span>
                <span className="setting-description">AI角色可以对动态进行点赞</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localSettings.allowAiLikes}
                  onChange={(e) => updateSetting('allowAiLikes', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* 隐私设置 */}
          <div className="settings-section">
            <h3 className="settings-section-title">隐私设置</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>默认隐私级别</span>
                <span className="setting-description">新动态的默认可见范围</span>
              </div>
              <select
                value={localSettings.privacyLevel}
                onChange={(e) => updateSetting('privacyLevel', e.target.value as 'public' | 'friends' | 'private')}
                className="setting-select"
              >
                <option value="public">公开</option>
                <option value="friends">仅好友</option>
                <option value="private">私密</option>
              </select>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span>新动态通知</span>
                <span className="setting-description">收到新动态时显示通知</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={localSettings.notifyOnNewPosts}
                  onChange={(e) => updateSetting('notifyOnNewPosts', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* 主题设置 */}
          <div className="settings-section">
            <h3 className="settings-section-title">主题设置</h3>
            
            <div className="setting-item">
              <div className="setting-label">
                <span>动态主题</span>
                <span className="setting-description">动态页面的显示主题</span>
              </div>
              <select
                value={localSettings.theme}
                onChange={(e) => updateSetting('theme', e.target.value)}
                className="setting-select"
              >
                <option value="default">默认</option>
                <option value="dark">深色</option>
                <option value="light">浅色</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 