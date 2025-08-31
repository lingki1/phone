'use client';

import { useState, useEffect, useCallback } from 'react';
import { SavedApiConfig } from './types';
import { apiConfigManager } from './apiConfigManager';
import './ApiConfigSelector.css';

interface ApiConfigSelectorProps {
  onConfigSelect: (config: SavedApiConfig) => void;
  currentConfig?: { proxyUrl: string; apiKey: string; model: string };
}

export default function ApiConfigSelector({ 
  onConfigSelect, 
  currentConfig 
}: ApiConfigSelectorProps) {
  const [savedConfigs, setSavedConfigs] = useState<SavedApiConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');

  const loadSavedConfigs = useCallback(async () => {
    try {
      setIsLoading(true);
      const configs = await apiConfigManager.getAllConfigs();
      setSavedConfigs(configs);
      
      // 如果有当前配置，尝试匹配已保存的配置
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
      console.error('加载已保存的配置失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentConfig]);

  useEffect(() => {
    loadSavedConfigs();
  }, [loadSavedConfigs]);

  const handleConfigSelect = (config: SavedApiConfig) => {
    // 无论是否已经选中，都调用回调函数
    // 这样可以确保即使重复点击同一个配置也能正常切换
    setSelectedConfigId(config.id);
    onConfigSelect(config);
  };

  const handleSetDefault = async (configId: string) => {
    try {
      await apiConfigManager.setDefaultConfig(configId);
      await loadSavedConfigs(); // 重新加载以更新默认标记
    } catch (error) {
      console.error('设置默认配置失败:', error);
      alert('设置默认配置失败');
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('确定要删除这个配置吗？')) {
      return;
    }

    try {
      await apiConfigManager.deleteConfig(configId);
      await loadSavedConfigs();
      
      // 如果删除的是当前选中的配置，清空选择
      if (selectedConfigId === configId) {
        setSelectedConfigId('');
      }
    } catch (error) {
      console.error('删除配置失败:', error);
      alert('删除配置失败');
    }
  };



  if (isLoading) {
    return (
      <div className="api-config-selector">
        <div className="selector-header">
          <h3>已保存的配置</h3>
        </div>
        <div className="loading-message">正在加载配置...</div>
      </div>
    );
  }

  if (savedConfigs.length === 0) {
    return (
      <div className="api-config-selector">
        <div className="selector-header">
          <h3>已保存的配置</h3>
        </div>
        <div className="empty-message">
          <p>暂无已保存的配置</p>
          <p className="hint">配置好API后可以保存以便快速切换</p>
        </div>
      </div>
    );
  }

  return (
    <div className="api-config-selector">
      <div className="selector-header">
        <h3>已保存的配置</h3>
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
                  {config.isDefault && <span className="default-badge">默认</span>}
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
                  title="设为默认"
                >
                  设为默认
                </button>
              )}
              <button 
                className="api-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConfig(config.id);
                }}
                title="删除配置"
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
