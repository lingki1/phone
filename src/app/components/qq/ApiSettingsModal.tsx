'use client';

import { useState, useEffect } from 'react';
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
  const [config, setConfig] = useState<ApiConfig>(currentConfig);
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingPlatformConfig, setIsLoadingPlatformConfig] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 用于强制刷新选择器

  // 从localStorage加载已保存的模型列表
  const loadSavedModels = () => {
    try {
      const savedModels = localStorage.getItem('savedModels');
      if (savedModels) {
        const parsedModels = JSON.parse(savedModels);
        if (Array.isArray(parsedModels)) {
          return parsedModels;
        }
      }
    } catch (error) {
      console.error('加载已保存的模型列表失败:', error);
    }
    return [];
  };

  // 保存模型列表到localStorage
  const saveModelsToStorage = (modelList: string[]) => {
    try {
      localStorage.setItem('savedModels', JSON.stringify(modelList));
    } catch (error) {
      console.error('保存模型列表失败:', error);
    }
  };

  useEffect(() => {
    if (isVisible) {
      setConfig(currentConfig);
      
      // 加载已保存的模型列表
      const savedModels = loadSavedModels();
      setModels(savedModels);
      
      // 移除全局设置加载，因为相关功能已被删除
    }
  }, [isVisible, currentConfig]);

  const handleInputChange = (field: keyof ApiConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 当用户修改URL或API Key时，清空模型列表
    if (field === 'proxyUrl' || field === 'apiKey') {
      setModels([]);
      // 清空localStorage中的模型列表
      localStorage.removeItem('savedModels');
      // 清空当前选择的模型
      setConfig(prev => ({ ...prev, model: '' }));
    }
  };

  const fetchModels = async () => {
    if (!config.proxyUrl || !config.apiKey) {
      alert('请先填写反代地址和API密钥');
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
      
      // 直接使用新获取的模型列表，不合并旧的模型
      setModels(modelList);
      saveModelsToStorage(modelList);
      
      // 如果当前选择的模型不在新列表中，清空选择
      if (config.model && !modelList.includes(config.model)) {
        setConfig(prev => ({ ...prev, model: '' }));
      }
      
      // 如果当前没有选择模型，选择第一个
      if (modelList.length > 0 && !config.model) {
        setConfig(prev => ({ ...prev, model: modelList[0] }));
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      alert(`获取模型列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = () => {
    if (!config.proxyUrl || !config.apiKey || !config.model) {
      alert('请填写完整的API配置信息');
      return;
    }

    // 保存API配置
    onSave(config);
    
    // 移除全局设置保存，因为相关功能已被删除
    
    onClose();
  };

  const handleConfigSelect = (savedConfig: SavedApiConfig) => {
    // 无论是否重复点击，都重新设置配置
    // 这样可以确保重复点击同一个配置也能正常切换
    setConfig({
      proxyUrl: savedConfig.proxyUrl,
      apiKey: savedConfig.apiKey,
      model: savedConfig.model
    });
    
    // 清空模型列表，因为切换了API配置
    setModels([]);
    localStorage.removeItem('savedModels');
  };

  const handleSaveConfig = () => {
    setShowSaveDialog(true);
  };

  const handleSaveConfigSuccess = () => {
    // 配置保存成功后的回调，强制刷新选择器
    setRefreshKey(prev => prev + 1);
  };

  // 移除智能角色活跃模式相关函数，因为功能已被删除

  // 检查当前选择的模型是否在可用模型列表中
  const isCurrentModelAvailable = config.model && models.includes(config.model);

  const handleUsePlatformConfig = async () => {
    try {
      setIsLoadingPlatformConfig(true);
      const resp = await fetch('/api/system-api-config');
      const json = await resp.json();
      if (!json?.success) {
        alert(json?.message || '获取平台配置失败');
        return;
      }
      if (!json?.data) {
        alert('平台未提供内置配置，请联系管理员');
        return;
      }
      const platformProxyUrl = String(json.data.proxyUrl || '/api/server-ai');
      const platformModel = String(json.data.model || '');
      // 应用平台配置到当前表单；apiKey 使用占位，真实密钥由服务器代理注入
      setConfig({ proxyUrl: platformProxyUrl, apiKey: 'server-proxy', model: platformModel });
      // 清空并刷新模型列表缓存
      setModels([]);
      localStorage.removeItem('savedModels');
    } catch (e) {
      console.error('加载平台配置失败:', e);
      alert('加载平台配置失败');
    } finally {
      setIsLoadingPlatformConfig(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="api-settings-modal">
        <div className="modal-header">
          <h2>AI 连接配置</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* 平台内置配置快捷使用 */}
          <div className="save-config-section">
            <button 
              className="groupmember-platform-config-btn"
              onClick={handleUsePlatformConfig}
              disabled={isLoadingPlatformConfig}
            >
              {isLoadingPlatformConfig ? '正在加载平台配置...' : '使用平台内置配置'}
            </button>
            <small className="save-config-hint">通过服务器代理安全使用平台提供的API，无需填写密钥</small>
          </div>
          {/* API配置选择器 */}
          <ApiConfigSelector 
            key={refreshKey} // 使用refreshKey强制重新渲染
            onConfigSelect={handleConfigSelect}
            currentConfig={config}
          />
          
          {/* 保存配置按钮 */}
          <div className="save-config-section">
            <button 
              className="save-config-btn" 
              onClick={handleSaveConfig}
              disabled={!config.proxyUrl || !config.apiKey || !config.model}
            >
              保存当前配置
            </button>
            <small className="save-config-hint">
              保存后可以快速切换不同的API配置
            </small>
          </div>



          <div className="form-group">
            <label htmlFor="proxy-url">服务器地址</label>
            <input
              type="text"
              id="proxy-url"
              value={config.proxyUrl}
              onChange={(e) => handleInputChange('proxyUrl', e.target.value)}
              placeholder="输入你的AI服务地址，例如: https://api.openai.com"
            />
            <small className="field-hint">不需要添加 /v1 后缀，系统会自动处理</small>
          </div>

          <div className="form-group">
            <label htmlFor="api-key">访问密钥</label>
            <input
              type="password"
              id="api-key"
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder="输入你的API密钥，以 sk- 开头"
            />
            <small className="field-hint">密钥会被安全保存，不会泄露给他人</small>
          </div>

          <div className="form-group">
            <label htmlFor="model-select">AI 模型选择</label>
            <select
              id="model-select"
              value={config.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
            >
              <option value="">点击选择你喜欢的AI模型</option>
              {models.map(model => (
                <option key={model} value={model}>
                  {model}
                  {model === config.model && !isCurrentModelAvailable && ' (已保存)'}
                </option>
              ))}
            </select>
            <small className="field-hint">
              {isCurrentModelAvailable 
                ? '不同模型有不同的特点和能力' 
                : '当前选择的模型可能不在可用列表中，建议重新获取模型列表'
              }
            </small>
          </div>

          <button 
            className="fetch-models-btn" 
            onClick={fetchModels}
            disabled={isLoadingModels}
          >
            {isLoadingModels ? '正在获取模型列表...' : '获取可用模型'}
          </button>


        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button className="save-btn" onClick={handleSave}>保存配置</button>
        </div>
      </div>
      
      {/* 保存配置对话框 */}
      <SaveConfigDialog
        isVisible={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveConfigSuccess}
        currentConfig={config}
      />
    </div>
  );
} 