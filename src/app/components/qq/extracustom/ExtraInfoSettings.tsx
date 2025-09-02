'use client';

import React, { useState, useEffect } from 'react';
import { ExtraInfoConfig } from './types';
import { WorldBook } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './ExtraInfoSettings.css';

interface ExtraInfoSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExtraInfoConfig;
  onUpdateConfig: (config: ExtraInfoConfig) => void;
  chatName: string;
}

export default function ExtraInfoSettings({ 
  isOpen, 
  onClose, 
  config, 
  onUpdateConfig,
  chatName: _chatName
}: ExtraInfoSettingsProps) {
  const [description, setDescription] = useState(config.description);
  const [isEnabled, setIsEnabled] = useState(config.enabled);
  const [availableWorldBooks, setAvailableWorldBooks] = useState<WorldBook[]>([]);
  const [selectedWorldBookId, setSelectedWorldBookId] = useState<string>('');
  const [isLoadingWorldBooks, setIsLoadingWorldBooks] = useState(false);

  // 加载可用的世界书
  useEffect(() => {
    const loadWorldBooks = async () => {
      if (!isOpen) return;
      
      setIsLoadingWorldBooks(true);
      try {
        await dataManager.initDB();
        const allWorldBooks = await dataManager.getAllWorldBooks();
        const extrainfoWorldBooks = allWorldBooks.filter(wb => wb.category === 'extrainfo');
        setAvailableWorldBooks(extrainfoWorldBooks);
        
        // 如果当前配置有描述，尝试找到对应的世界书
        if (config.description) {
          const currentWorldBook = extrainfoWorldBooks.find(wb => wb.content === config.description);
          if (currentWorldBook) {
            setSelectedWorldBookId(currentWorldBook.id);
          }
        }
      } catch (error) {
        console.error('Failed to load world books:', error);
      } finally {
        setIsLoadingWorldBooks(false);
      }
    };

    loadWorldBooks();
  }, [isOpen, config.description]);

  // 选择世界书
  const handleWorldBookSelect = (worldBook: WorldBook) => {
    setSelectedWorldBookId(worldBook.id);
    setDescription(worldBook.content);
  };

  // 创建新的世界书配置
  const handleCreateNew = () => {
    setSelectedWorldBookId('');
    setDescription('');
  };

  const handleSave = () => {
    const updatedConfig: ExtraInfoConfig = {
      ...config,
      enabled: isEnabled,
      description: description.trim(),
      lastUpdate: Date.now()
    };
    
    onUpdateConfig(updatedConfig);
    onClose();
  };

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    if (isEnabled) {
      setDescription('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="extra-info-settings-overlay" onClick={onClose}>
      <div className="extra-info-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="extra-info-modal-header">
          <h3>额外信息设置</h3>
          <button className="extra-info-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="extra-info-modal-content">
          <div className="extra-info-setting-item">
            <label className="extra-info-setting-label">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={handleToggle}
              />
              <span>启用额外信息功能</span>
            </label>
            <p className="extra-info-setting-description">
              启用后，AI会在回复中包含HTML格式的额外信息
            </p>
            <p className="extra-info-setting-description extra-info-worldbook-info">
              💡 配置将自动保存到世界书系统，分类为&quot;extrainfo&quot;
            </p>
          </div>

          {isEnabled && (
            <div className="extra-info-setting-item">
              <label className="extra-info-setting-label">选择配置</label>
              <div className="extra-info-worldbook-selection">
                {isLoadingWorldBooks ? (
                  <div className="extra-info-loading-indicator">加载中...</div>
                ) : (
                  <>
                    <div className="extra-info-worldbook-list">
                      {availableWorldBooks.length > 0 ? (
                        availableWorldBooks.map((worldBook) => (
                          <div
                            key={worldBook.id}
                            className={`extra-info-worldbook-item ${selectedWorldBookId === worldBook.id ? 'selected' : ''}`}
                            onClick={() => handleWorldBookSelect(worldBook)}
                          >
                            <div className="extra-info-worldbook-name">{worldBook.name}</div>
                            <div className="extra-info-worldbook-content">{worldBook.content}</div>
                            <div className="extra-info-worldbook-meta">
                              {new Date(worldBook.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="extra-info-no-worldbooks">暂无可用配置</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="extra-info-create-new-btn"
                      onClick={handleCreateNew}
                    >
                      ✨ 创建新配置
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          
          {isEnabled && (
            <div className="extra-info-setting-item">
              <label className="extra-info-setting-label">功能描述</label>
              {selectedWorldBookId && (
                <div className="extra-info-selected-config-info">
                  <span className="extra-info-selected-badge">✓ 使用现有配置</span>
                  <span className="extra-config-name">
                    {availableWorldBooks.find(wb => wb.id === selectedWorldBookId)?.name}
                  </span>
                </div>
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：我希望制作一个状态栏，显示当前的心情、位置和穿着信息"
                rows={4}
                className="extra-info-description-input"
              />
              <p className="extra-info-setting-description">
                请详细描述你希望AI生成的额外信息内容和样式
              </p>
              <p className="extra-info-setting-description extra-info-worldbook-info">
                📝 描述内容将作为世界书内容保存，AI会根据此描述生成相应的HTML
              </p>
            </div>
          )}
          

        </div>
        
        <div className="extra-info-modal-footer">
          <button className="extra-info-cancel-btn" onClick={onClose}>取消</button>
          <button 
            className="extra-info-save-btn" 
            onClick={handleSave}
            disabled={isEnabled && !description.trim()}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
