'use client';

import React, { useState } from 'react';
import { DiscoverSettings } from '../../types/discover';
import { autoGenerationService } from './utils/autoGenerationService';
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
      
      // 更新自动生成服务设置
      await autoGenerationService.updateSettings(localSettings);
      
      console.log('✅ 设置已保存并更新自动生成服务');
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
    console.log(`🔧 设置更新: ${key} = ${value}`);
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="api-settings-modal">
        <div className="modal-header">
          <h2>动态设置</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="modal-body">
          {/* 当前状态显示 */}
          <div className="tip-box">
            <div className="status-item">
              <span>当前状态:</span>
              <span className={`status-value ${settings.autoGeneratePosts ? 'active' : 'inactive'}`}>
                {settings.autoGeneratePosts ? '✅ 自动生成动态已开启' : '❌ 自动生成动态已关闭'}
              </span>
            </div>
            <div className="status-item">
              <span>评论状态:</span>
              <span className={`status-value ${settings.allowAiComments ? 'active' : 'inactive'}`}>
                {settings.allowAiComments ? '✅ AI评论已开启' : '❌ AI评论已关闭'}
              </span>
            </div>
          </div>

          {/* AI自动生成设置 */}
          <div className="form-group">
            <label htmlFor="auto-generate-posts">自动生成AI动态</label>
            <div className="toggle-group">
              <div className="toggle-label">
                <span>AI角色会自动发布动态</span>
              </div>
              <input
                type="checkbox"
                id="auto-generate-posts"
                checked={localSettings.autoGeneratePosts}
                onChange={(e) => updateSetting('autoGeneratePosts', e.target.checked)}
              />
            </div>
          </div>

          {localSettings.autoGeneratePosts && (
            <div className="form-group">
              <label htmlFor="generate-interval">生成间隔（分钟）</label>
              <input
                type="number"
                id="generate-interval"
                min="30"
                max="1440"
                value={localSettings.autoGenerateInterval}
                onChange={(e) => updateSetting('autoGenerateInterval', parseInt(e.target.value) || 60)}
                className="number-input"
              />
              <small className="field-hint">AI动态生成的时间间隔</small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="max-posts-per-day">每日最大动态数</label>
            <input
              type="number"
              id="max-posts-per-day"
              min="1"
              max="50"
              value={localSettings.maxPostsPerDay}
              onChange={(e) => updateSetting('maxPostsPerDay', parseInt(e.target.value) || 10)}
              className="number-input"
            />
            <small className="field-hint">限制每日发布的动态数量</small>
          </div>

          <hr className="divider" />

          {/* AI互动设置 */}
          <div className="form-group">
            <label htmlFor="allow-ai-comments">允许AI评论</label>
            <div className="toggle-group">
              <div className="toggle-label">
                <span>AI角色可以对动态进行评论</span>
              </div>
              <input
                type="checkbox"
                id="allow-ai-comments"
                checked={localSettings.allowAiComments}
                onChange={(e) => updateSetting('allowAiComments', e.target.checked)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="allow-ai-likes">允许AI点赞</label>
            <div className="toggle-group">
              <div className="toggle-label">
                <span>AI角色可以对动态进行点赞</span>
              </div>
              <input
                type="checkbox"
                id="allow-ai-likes"
                checked={localSettings.allowAiLikes}
                onChange={(e) => updateSetting('allowAiLikes', e.target.checked)}
              />
            </div>
          </div>

          <hr className="divider" />

          {/* 隐私设置 */}
          <div className="form-group">
            <label htmlFor="privacy-level">默认隐私级别</label>
            <select
              id="privacy-level"
              value={localSettings.privacyLevel}
              onChange={(e) => updateSetting('privacyLevel', e.target.value as 'public' | 'friends' | 'private')}
            >
              <option value="public">公开</option>
              <option value="friends">仅好友</option>
              <option value="private">私密</option>
            </select>
            <small className="field-hint">新动态的默认可见范围</small>
          </div>

          <div className="form-group">
            <label htmlFor="notify-on-new-posts">新动态通知</label>
            <div className="toggle-group">
              <div className="toggle-label">
                <span>收到新动态时显示通知</span>
              </div>
              <input
                type="checkbox"
                id="notify-on-new-posts"
                checked={localSettings.notifyOnNewPosts}
                onChange={(e) => updateSetting('notifyOnNewPosts', e.target.checked)}
              />
            </div>
          </div>

          <hr className="divider" />

          {/* 主题设置 */}
          <div className="form-group">
            <label htmlFor="theme">动态主题</label>
            <select
              id="theme"
              value={localSettings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
            >
              <option value="default">默认</option>
              <option value="dark">深色</option>
              <option value="light">浅色</option>
              <option value="auto">跟随系统</option>
            </select>
            <small className="field-hint">动态页面的显示主题</small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onCancel} disabled={isSaving}>取消</button>
          <button className="save-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
} 