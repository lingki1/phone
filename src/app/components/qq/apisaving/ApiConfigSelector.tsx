'use client';

import { useState, useEffect, useCallback } from 'react';
import { SavedApiConfig } from './types';
import { apiConfigManager } from './apiConfigManager';
import { useI18n } from '../../i18n/I18nProvider';
import './ApiConfigSelector.css';

interface ApiConfigSelectorProps {
  onConfigSelect: (config: SavedApiConfig) => void;
  currentConfig?: { proxyUrl: string; apiKey: string; model: string };
}

export default function ApiConfigSelector({ 
  onConfigSelect, 
  currentConfig 
}: ApiConfigSelectorProps) {
  const { t } = useI18n();
  const [savedConfigs, setSavedConfigs] = useState<SavedApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  const loadSavedConfigs = useCallback(async () => {
    try {
      setIsLoading(true);
      const configs = await apiConfigManager.getAllConfigs();
      setSavedConfigs(configs);
      
      // If there is current configuration, try to match saved configuration
      if (currentConfig) {
        const matchingConfig = configs.find(config => 
          config.proxyUrl === currentConfig.proxyUrl &&
          config.apiKey === currentConfig.apiKey &&
          config.model === currentConfig.model
        );
        if (matchingConfig) {
          setSelectedConfigId(matchingConfig.id);
        }
      }
    } catch (error) {
      console.error(t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.logs.loadConfigsFailed', '加载已保存的配置失败:'), error);
    } finally {
      setIsLoading(false);
    }
  }, [currentConfig, t]);

  useEffect(() => {
    loadSavedConfigs();
  }, [loadSavedConfigs]);

  const handleConfigSelect = (config: SavedApiConfig) => {
    // Always call callback function regardless of whether it is already selected
    // This ensures that even clicking the same configuration repeatedly can switch normally
    setSelectedConfigId(config.id);
    onConfigSelect(config);
  };

  const handleSetDefault = async (configId: string) => {
    try {
      await apiConfigManager.setDefaultConfig(configId);
      await loadSavedConfigs(); // Reload to update default flag
    } catch (error) {
      console.error(t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.logs.setDefaultFailed', '设置默认配置失败:'), error);
      alert(t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.errors.setDefaultFailed', '设置默认配置失败'));
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm(t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.confirm.deleteConfig', '确定要删除这个配置吗？'))) {
      return;
    }

    try {
      await apiConfigManager.deleteConfig(configId);
      await loadSavedConfigs();
      
      // If the deleted configuration is currently selected, clear selection
      if (selectedConfigId === configId) {
        setSelectedConfigId('');
      }
    } catch (error) {
      console.error(t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.logs.deleteFailed', '删除配置失败:'), error);
      alert(t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.errors.deleteFailed', '删除配置失败'));
    }
  };



  if (isLoading) {
    return (
      <div className="api-config-selector">
        <div className="selector-header">
          <h3>{t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.title', '已保存的配置')}</h3>
        </div>
        <div className="loading-message">{t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.loading', '正在加载配置...')}</div>
      </div>
    );
  }

  if (savedConfigs.length === 0) {
    return (
      <div className="api-config-selector">
        <div className="selector-header">
          <h3>{t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.title', '已保存的配置')}</h3>
        </div>
        <div className="empty-message">
          <p>{t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.empty', '暂无已保存的配置')}</p>
          <p className="hint">{t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.hint', '配置好API后可以保存以便快速切换')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="api-config-selector">
      <div className="selector-header">
        <h3>{t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.title', '已保存的配置')}</h3>
        <span className="config-count">({savedConfigs.length})</span>
      </div>
      
      <div className="config-list">
        {savedConfigs.map(config => (
          <div 
            key={config.id} 
            className={`config-item ${selectedConfigId === config.id ? 'selected' : ''} ${config.isDefault ? 'default' : ''}`}
          >
            <div className="config-info" onClick={() => handleConfigSelect(config)}>
              <div className="config-row-1">
                <span className="config-name">
                  {config.name}
                  {config.isDefault && <span className="default-badge">{t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.defaultBadge', '默认')}</span>}
                </span>
                <span className="config-url">{config.proxyUrl}</span>
              </div>
              <div className="config-row-2">
                <span className="config-model">{config.model}</span>
              </div>
            </div>
            
            <div className="config-actions">
              {!config.isDefault && (
                <button 
                  className="set-default-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetDefault(config.id);
                  }}
                  title={t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.setDefault', '设为默认')}
                >
                  {t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.setDefault', '设为默认')}
                </button>
              )}
              <button 
                className="api-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConfig(config.id);
                }}
                title={t('QQ.ChatInterface.Me.ApiSaving.ApiConfigSelector.deleteConfig', '删除配置')}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
