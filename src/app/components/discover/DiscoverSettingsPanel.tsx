'use client';

import React, { useState, useEffect } from 'react';
import { DiscoverSettings } from '../../types/discover';
import { dataManager } from '../../utils/dataManager';
import { aiPostGenerator } from './utils/aiPostGenerator';
import { aiCommentService } from './utils/aiCommentService';
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

  // 后台自动生成功能 - 使用已保存的设置，而不是本地临时设置
  useEffect(() => {
    let postInterval: NodeJS.Timeout | null = null;
    let commentInterval: NodeJS.Timeout | null = null;

    // 启动自动生成动态
    if (settings.autoGeneratePosts) {
      console.log('🚀 启动自动生成动态，间隔:', settings.autoGenerateInterval, '分钟');
      
      const generatePost = async () => {
        try {
          const chats = await dataManager.getAllChats();
          const aiCharacters = chats.filter(chat => !chat.isGroup);
          
          if (aiCharacters.length > 0) {
            console.log('📝 自动生成AI动态');
            const result = await aiPostGenerator.generateSinglePostWithComments(aiCharacters);
            if (result.post) {
              console.log('✅ 自动生成动态成功:', result.post.content.substring(0, 50) + '...');
              
              // 触发动态更新事件
              window.dispatchEvent(new CustomEvent('aiPostGenerated', {
                detail: { post: result.post, comments: result.comments }
              }));
            }
          }
        } catch (error) {
          console.error('❌ 自动生成动态失败:', error);
        }
      };

      // 立即执行一次
      generatePost();
      
      // 设置定时器
      postInterval = setInterval(generatePost, settings.autoGenerateInterval * 60 * 1000);
    }

    // 启动自动生成评论（只对用户动态）
    if (settings.allowAiComments) {
      console.log('💬 启动自动生成评论');
      
      const generateComments = async () => {
        try {
          // 获取所有动态
          const allPosts = await dataManager.getAllDiscoverPosts();
          
          // 只处理用户发布的动态（非AI生成）
          const userPosts = allPosts.filter(post => 
            post.authorId === 'user' && !post.aiGenerated
          );
          
          if (userPosts.length > 0) {
            // 随机选择一个用户动态进行评论
            const randomPost = userPosts[Math.floor(Math.random() * userPosts.length)];
            
            console.log('💬 为用户动态生成AI评论:', randomPost.content.substring(0, 30) + '...');
            await aiCommentService.generateCommentsForPost(randomPost);
          }
        } catch (error) {
          console.error('❌ 自动生成评论失败:', error);
        }
      };

      // 设置定时器，每5分钟检查一次
      commentInterval = setInterval(generateComments, 5 * 60 * 1000);
    }

    // 清理函数
    return () => {
      if (postInterval) {
        clearInterval(postInterval);
        console.log('🛑 停止自动生成动态');
      }
      if (commentInterval) {
        clearInterval(commentInterval);
        console.log('🛑 停止自动生成评论');
      }
    };
  }, [settings.autoGeneratePosts, settings.allowAiComments, settings.autoGenerateInterval]);

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
    console.log(`🔧 设置更新: ${key} = ${value}`);
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
            
            {/* 当前状态显示 */}
            <div className="setting-status">
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