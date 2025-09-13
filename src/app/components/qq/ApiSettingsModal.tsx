'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../components/i18n/I18nProvider';
import './ApiSettingsModal.css';
import ApiConfigSelector from './apisaving/ApiConfigSelector';
import SaveConfigDialog from './apisaving/SaveConfigDialog';
import { SavedApiConfig } from './apisaving/types';

interface ApiConfig {
  proxyUrl: string;
  apiKey: string;
  model: string;
}

interface ApiSettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (config: ApiConfig) => void;
  currentConfig: ApiConfig;
}

export default function ApiSettingsModal({ 
  isVisible, 
  onClose, 
  onSave, 
  currentConfig 
}: ApiSettingsModalProps) {
  const { t } = useI18n();
  const [config, setConfig] = useState<ApiConfig>(currentConfig);
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingPlatformConfig, setIsLoadingPlatformConfig] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force refresh selector

  // Load saved model list from localStorage
  const loadSavedModels = useCallback(() => {
    try {
      const savedModels = localStorage.getItem('savedModels');
      if (savedModels) {
        const parsedModels = JSON.parse(savedModels);
        if (Array.isArray(parsedModels)) {
          return parsedModels;
        }
      }
    } catch (error) {
      console.error(t('QQ.ChatInterface.Me.ApiSettingsModal.logs.loadSavedModelsFailed', '加载已保存的模型列表失败:'), error);
    }
    return [];
  }, [t]);

  // Save model list to localStorage
  const saveModelsToStorage = (modelList: string[]) => {
    try {
      localStorage.setItem('savedModels', JSON.stringify(modelList));
    } catch (error) {
      console.error(t('QQ.ChatInterface.Me.ApiSettingsModal.logs.saveModelsFailed', '保存模型列表失败:'), error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      setConfig(currentConfig);
      
      // Load saved model list
      const savedModels = loadSavedModels();
      setModels(savedModels);
      
      // Remove global settings loading as related functionality has been removed
    }
  }, [isVisible, currentConfig, loadSavedModels]);

  const handleInputChange = (field: keyof ApiConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear model list when user modifies URL or API Key
    if (field === 'proxyUrl' || field === 'apiKey') {
      setModels([]);
      // Clear model list in localStorage
      localStorage.removeItem('savedModels');
      // Clear currently selected model
      setConfig(prev => ({ ...prev, model: '' }));
    }
  };

  const fetchModels = async () => {
    if (!config.proxyUrl || !config.apiKey) {
      alert(t('QQ.ChatInterface.Me.ApiSettingsModal.errors.fillProxyAndKey', '请先填写反代地址和API密钥'));
      return;
    }

    setIsLoadingModels(true);
    try {
      const response = await fetch(`${config.proxyUrl}/v1/models`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const modelList = data.data?.map((model: { id: string }) => model.id) || [];
      
      // Use newly fetched model list directly, do not merge with old models
      setModels(modelList);
      saveModelsToStorage(modelList);
      
      // If currently selected model is not in new list, clear selection
      if (config.model && !modelList.includes(config.model)) {
        setConfig(prev => ({ ...prev, model: '' }));
      }
      
      // If no model is currently selected, select the first one
      if (modelList.length > 0 && !config.model) {
        setConfig(prev => ({ ...prev, model: modelList[0] }));
      }
    } catch (error) {
      console.error(t('QQ.ChatInterface.Me.ApiSettingsModal.logs.fetchModelsFailed', '获取模型列表失败:'), error);
      alert(`${t('QQ.ChatInterface.Me.ApiSettingsModal.errors.fetchModelsFailed', '获取模型列表失败')}: ${error instanceof Error ? error.message : t('QQ.ChatInterface.Me.ApiSettingsModal.errors.unknownError', '未知错误')}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = () => {
    if (!config.proxyUrl || !config.apiKey || !config.model) {
      alert(t('QQ.ChatInterface.Me.ApiSettingsModal.errors.fillAll', '请填写完整的API配置信息'));
      return;
    }

    // Save API configuration
    onSave(config);
    
    // Remove global settings save as related functionality has been removed
    
    onClose();
  };

  const handleConfigSelect = (savedConfig: SavedApiConfig) => {
    // Always reset configuration regardless of whether it is clicked repeatedly
    // This ensures that clicking the same configuration repeatedly can also switch normally
    setConfig({
      proxyUrl: savedConfig.proxyUrl,
      apiKey: savedConfig.apiKey,
      model: savedConfig.model
    });
    
    // Clear model list because API configuration has been switched
    setModels([]);
    localStorage.removeItem('savedModels');
  };

  const handleSaveConfig = () => {
    setShowSaveDialog(true);
  };

  const handleSaveConfigSuccess = () => {
    // Callback after configuration save success, force refresh selector
    setRefreshKey(prev => prev + 1);
  };

  // Remove smart character active mode related functions as functionality has been removed

  // Check if currently selected model is in available model list
  const isCurrentModelAvailable = config.model && models.includes(config.model);

  const handleUsePlatformConfig = async () => {
    try {
      setIsLoadingPlatformConfig(true);
      const resp = await fetch('/api/system-api-config');
      const json = await resp.json();
      if (!json?.success) {
        alert(json?.message || t('QQ.ChatInterface.Me.ApiSettingsModal.errors.platformFailed', '获取平台配置失败'));
        return;
      }
      if (!json?.data) {
        alert(t('QQ.ChatInterface.Me.ApiSettingsModal.errors.noPlatformConfig', '平台未提供内置配置，请联系管理员'));
        return;
      }
      const platformProxyUrl = String(json.data.proxyUrl || '/api/server-ai');
      const platformModel = String(json.data.model || '');
      // Apply platform configuration to current form; apiKey uses placeholder, real key injected by server proxy
      setConfig({ proxyUrl: platformProxyUrl, apiKey: 'server-proxy', model: platformModel });
      // Clear and refresh model list cache
      setModels([]);
      localStorage.removeItem('savedModels');
    } catch (e) {
      console.error(t('QQ.ChatInterface.Me.ApiSettingsModal.logs.loadPlatformFailed', '加载平台配置失败:'), e);
      alert(t('QQ.ChatInterface.Me.ApiSettingsModal.errors.loadPlatformFailed', '加载平台配置失败'));
    } finally {
      setIsLoadingPlatformConfig(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="api-settings-modal">
        <div className="modal-header">
          <h2>{t('QQ.ChatInterface.Me.ApiSettingsModal.title', 'AI 连接配置')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* API Configuration Selector */}
          <ApiConfigSelector 
            key={refreshKey} // Use refreshKey to force re-render
            onConfigSelect={handleConfigSelect}
            currentConfig={config}
          />
          
          {/* Save Configuration Button */}
          <div className="save-config-section">
            <button 
              className="save-config-btn" 
              onClick={handleSaveConfig}
              disabled={!config.proxyUrl || !config.apiKey || !config.model}
            >
              {t('QQ.ChatInterface.Me.ApiSettingsModal.buttons.saveCurrent', '保存当前配置')}
            </button>
            <small className="save-config-hint">
              {t('QQ.ChatInterface.Me.ApiSettingsModal.hints.saveHint', '保存后可以快速切换不同的API配置')}
            </small>
          </div>



          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label htmlFor="proxy-url">{t('QQ.ChatInterface.Me.ApiSettingsModal.labels.enterServerOr', '请输入服务器地址 或')}</label>
              <button 
                type="button"
                className="groupmember-platform-config-btn"
                onClick={async () => {
                  await handleUsePlatformConfig();
                  alert(t('QQ.ChatInterface.Me.ApiSettingsModal.success.platformApplied', '已经为您配置好平台API，请点击“获取可用模型”并选择你喜欢的模型。'));
                }}
                disabled={isLoadingPlatformConfig}
              >
                {isLoadingPlatformConfig ? t('QQ.ChatInterface.Me.ApiSettingsModal.buttons.loading', '加载中...') : t('QQ.ChatInterface.Me.ApiSettingsModal.buttons.usePlatform', '使用平台内置AI')}
              </button>
            </div>
            <input
              type="text"
              id="proxy-url"
              value={config.proxyUrl}
              onChange={(e) => handleInputChange('proxyUrl', e.target.value)}
              placeholder={t('QQ.ChatInterface.Me.ApiSettingsModal.placeholders.proxy', '输入你的AI服务地址，例如: https://api.openai.com')}
            />
            <small className="field-hint">{t('QQ.ChatInterface.Me.ApiSettingsModal.hints.proxy', '不需要添加 /v1 后缀，系统会自动处理')}</small>
          </div>

          <div className="form-group">
            <label htmlFor="api-key">{t('QQ.ChatInterface.Me.ApiSettingsModal.labels.apiKey', '访问密钥')}</label>
            <input
              type="password"
              id="api-key"
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder={t('QQ.ChatInterface.Me.ApiSettingsModal.placeholders.key', '输入你的API密钥，以 sk- 开头')}
            />
            <small className="field-hint">{t('QQ.ChatInterface.Me.ApiSettingsModal.hints.key', '密钥会被安全保存，不会泄露给他人')}</small>
          </div>

          <div className="form-group">
            <label htmlFor="model-select">{t('QQ.ChatInterface.Me.ApiSettingsModal.labels.model', 'AI 模型选择')}</label>
            <select
              id="model-select"
              value={config.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
            >
              <option value="">{t('QQ.ChatInterface.Me.ApiSettingsModal.placeholders.model', '点击选择你喜欢的AI模型')}</option>
              {models.map(model => (
                <option key={model} value={model}>
                  {model}
                  {model === config.model && !isCurrentModelAvailable && ` (${t('QQ.ChatInterface.Me.ApiSettingsModal.status.saved', '已保存')})`}
                </option>
              ))}
            </select>
            <small className="field-hint">
              {isCurrentModelAvailable 
                ? t('QQ.ChatInterface.Me.ApiSettingsModal.hints.modelDiff', '不同模型有不同的特点和能力')
                : t('QQ.ChatInterface.Me.ApiSettingsModal.hints.modelNotInList', '当前选择的模型可能不在可用列表中，建议重新获取模型列表')
              }
            </small>
          </div>

          <button 
            className="fetch-models-btn" 
            onClick={fetchModels}
            disabled={isLoadingModels}
          >
            {isLoadingModels ? t('QQ.ChatInterface.Me.ApiSettingsModal.buttons.fetching', '正在获取模型列表...') : t('QQ.ChatInterface.Me.ApiSettingsModal.buttons.fetch', '获取可用模型')}
          </button>


        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>{t('QQ.ChatInterface.Me.ApiSettingsModal.buttons.cancel', '取消')}</button>
          <button className="save-btn" onClick={handleSave}>{t('QQ.ChatInterface.Me.ApiSettingsModal.buttons.save', '保存配置')}</button>
        </div>
      </div>
      
      {/* Save Configuration Dialog */}
      <SaveConfigDialog
        isVisible={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveConfigSuccess}
        currentConfig={config}
      />
    </div>
  );
} 