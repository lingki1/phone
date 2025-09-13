'use client';

import React, { useState, useEffect } from 'react';
import { ExtraInfoConfig } from './types';
import { WorldBook } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './ExtraInfoSettings.css';
import { useI18n } from '../../i18n/I18nProvider';

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
  const { t, locale } = useI18n();
  const [description, setDescription] = useState(config.description);
  const [isEnabled, setIsEnabled] = useState(config.enabled);
  const [availableWorldBooks, setAvailableWorldBooks] = useState<WorldBook[]>([]);
  const [selectedWorldBookId, setSelectedWorldBookId] = useState<string>('');
  const [isLoadingWorldBooks, setIsLoadingWorldBooks] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  // 删除世界书条目
  const handleDeleteWorldBook = async (worldBookId: string) => {
    setDeletingId(worldBookId);
    try {
      await dataManager.initDB();
      await dataManager.deleteWorldBook(worldBookId);
      
      // 重新加载世界书列表
      const allWorldBooks = await dataManager.getAllWorldBooks();
      const extrainfoWorldBooks = allWorldBooks.filter(wb => wb.category === 'extrainfo');
      setAvailableWorldBooks(extrainfoWorldBooks);
      
      // 如果删除的是当前选中的世界书，清空选择
      if (selectedWorldBookId === worldBookId) {
        setSelectedWorldBookId('');
        setDescription('');
      }
      
      console.log('World book deleted successfully:', worldBookId);
    } catch (error) {
      console.error('Failed to delete world book:', error);
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  // 显示删除确认
  const showDeleteConfirmation = (worldBookId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 阻止触发卡片选择
    setShowDeleteConfirm(worldBookId);
  };

  if (!isOpen) return null;

  return (
    <div className="extra-info-settings-overlay" onClick={onClose}>
      <div className="extra-info-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="extra-info-modal-header">
          <h3>{t('QQ.ChatInterface.ExtraInfoSettings.title', '额外信息设置')}</h3>
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
              <span>{t('QQ.ChatInterface.ExtraInfoSettings.enable.label', '启用额外信息功能')}</span>
            </label>
            <p className="extra-info-setting-description">
              {t('QQ.ChatInterface.ExtraInfoSettings.enable.desc', '启用后，AI会在回复中包含HTML格式的额外信息')}
            </p>
            <p className="extra-info-setting-description extra-info-worldbook-info">
              {t('QQ.ChatInterface.ExtraInfoSettings.enable.worldbookTip', '配置将自动保存到世界书系统，分类为"extrainfo"')}
            </p>
          </div>

          {isEnabled && (
            <div className="extra-info-setting-item">
              <label className="extra-info-setting-label">{t('QQ.ChatInterface.ExtraInfoSettings.select.label', '选择配置')}</label>
              <div className="extra-info-worldbook-selection">
                {isLoadingWorldBooks ? (
                  <div className="extra-info-loading-indicator">{t('QQ.ChatInterface.ExtraInfoSettings.select.loading', '加载中...')}</div>
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
                            <div className="extra-info-worldbook-content-wrapper">
                              <div className="extra-info-worldbook-name">{worldBook.name}</div>
                              <div className="extra-info-worldbook-content">{worldBook.content}</div>
                              <div className="extra-info-worldbook-meta">
                                {new Date(worldBook.updatedAt).toLocaleDateString(locale || 'zh-CN')}
                              </div>
                            </div>
                            <button
                              className="extra-info-delete-btn"
                              onClick={(e) => showDeleteConfirmation(worldBook.id, e)}
                              disabled={deletingId === worldBook.id}
                              title={t('QQ.ChatInterface.ExtraInfoSettings.select.deleteTitle', '删除配置')}
                            >
                              {deletingId === worldBook.id ? (
                                <div className="extra-info-delete-spinner"></div>
                              ) : (
                                '🗑️'
                              )}
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="extra-info-no-worldbooks">{t('QQ.ChatInterface.ExtraInfoSettings.select.empty', '暂无可用配置')}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="extra-info-create-new-btn"
                      onClick={handleCreateNew}
                    >
                      ✨ {t('QQ.ChatInterface.ExtraInfoSettings.select.createNew', '创建新配置')}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          
          {isEnabled && (
            <div className="extra-info-setting-item">
              <label className="extra-info-setting-label">{t('QQ.ChatInterface.ExtraInfoSettings.description.label', '功能描述')}</label>
              {selectedWorldBookId && (
                <div className="extra-info-selected-config-info">
                  <span className="extra-info-selected-badge">{t('QQ.ChatInterface.ExtraInfoSettings.description.selectedBadge', '✓ 使用现有配置')}</span>
                  <span className="extra-config-name">
                    {availableWorldBooks.find(wb => wb.id === selectedWorldBookId)?.name}
                  </span>
                </div>
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('QQ.ChatInterface.ExtraInfoSettings.description.placeholder', '例如：我希望制作一个状态栏，显示当前的心情、位置和穿着信息')}
                rows={4}
                className="extra-info-description-input"
              />
              <p className="extra-info-setting-description">
                {t('QQ.ChatInterface.ExtraInfoSettings.description.desc', '请详细描述你希望AI生成的额外信息内容和样式')}
              </p>
              <p className="extra-info-setting-description extra-info-worldbook-info">
                {t('QQ.ChatInterface.ExtraInfoSettings.description.worldbookTip', '📝 描述内容将作为世界书内容保存，AI会根据此描述生成相应的HTML')}
              </p>
            </div>
          )}
          

        </div>
        
        <div className="extra-info-modal-footer">
          <button className="extra-info-cancel-btn" onClick={onClose}>{t('QQ.ChatInterface.ExtraInfoSettings.footer.cancel', '取消')}</button>
          <button 
            className="extra-info-save-btn" 
            onClick={handleSave}
            disabled={isEnabled && !description.trim()}
          >
            {t('QQ.ChatInterface.ExtraInfoSettings.footer.save', '保存')}
          </button>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="extra-info-delete-modal">
          <div className="extra-info-modal-overlay" onClick={() => setShowDeleteConfirm(null)}></div>
          <div className="extra-info-modal-content">
            <div className="extra-info-modal-header">
              <h3>{t('QQ.ChatInterface.ExtraInfoSettings.confirmDelete.title', '确认删除')}</h3>
              <button 
                className="extra-info-modal-close"
                onClick={() => setShowDeleteConfirm(null)}
              >
                ×
              </button>
            </div>
            <div className="extra-info-modal-body">
              <div className="extra-info-delete-warning">
                <div className="extra-info-warning-icon">⚠️</div>
                <h4>{t('QQ.ChatInterface.ExtraInfoSettings.confirmDelete.messageTitle', '确定要删除这个配置吗？')}</h4>
                <p>{t('QQ.ChatInterface.ExtraInfoSettings.confirmDelete.messageDesc', '删除后将无法恢复，此操作会同时从世界书中移除该条目。')}</p>
                {(() => {
                  const worldBook = availableWorldBooks.find(wb => wb.id === showDeleteConfirm);
                  return worldBook ? (
                    <div className="extra-info-delete-info">
                      <p><strong>{t('QQ.ChatInterface.ExtraInfoSettings.confirmDelete.name', '配置名称：')}</strong>{worldBook.name}</p>
                      <p><strong>{t('QQ.ChatInterface.ExtraInfoSettings.confirmDelete.createdAt', '创建时间：')}</strong>{new Date(worldBook.createdAt || Date.now()).toLocaleDateString(locale || 'zh-CN')}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
            <div className="extra-info-modal-actions">
              <button 
                className="extra-info-cancel-btn"
                onClick={() => setShowDeleteConfirm(null)}
              >
                {t('QQ.ChatInterface.ExtraInfoSettings.confirmDelete.cancel', '取消')}
              </button>
              <button 
                className="extra-info-confirm-delete-btn"
                onClick={() => handleDeleteWorldBook(showDeleteConfirm)}
                disabled={deletingId === showDeleteConfirm}
              >
                {deletingId === showDeleteConfirm ? t('QQ.ChatInterface.ExtraInfoSettings.confirmDelete.deleting', '删除中...') : t('QQ.ChatInterface.ExtraInfoSettings.confirmDelete.confirm', '确认删除')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
