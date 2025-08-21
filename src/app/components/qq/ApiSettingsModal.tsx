'use client';

import { useState, useEffect } from 'react';
import './ApiSettingsModal.css';

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
  const [backgroundActivity, setBackgroundActivity] = useState(false);
  const [backgroundInterval, setBackgroundInterval] = useState(60);
  const [maxMemory, setMaxMemory] = useState(20);

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
      
      // 从localStorage加载其他设置
      const savedSettings = localStorage.getItem('globalSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setBackgroundActivity(settings.enableBackgroundActivity || false);
        setBackgroundInterval(settings.backgroundActivityInterval || 60);
        setMaxMemory(settings.maxMemory || 20);
      }
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
    
    // 保存其他全局设置
    const globalSettings = {
      enableBackgroundActivity: backgroundActivity,
      backgroundActivityInterval: backgroundInterval,
      maxMemory: maxMemory
    };
    localStorage.setItem('globalSettings', JSON.stringify(globalSettings));
    
    onClose();
  };

  const handleBackgroundActivityChange = (enabled: boolean) => {
    if (enabled && !backgroundActivity) {
      // 从关到开，显示警告
      const confirmed = confirm(
        '警告：启用后台角色活动会显著增加API调用次数和费用！\n\n' +
        '该功能会让AI角色在后台定期活动，即使您不主动聊天也会产生API调用。\n\n' +
        '确定要启用吗？'
      );
      if (!confirmed) return;
    }
    setBackgroundActivity(enabled);
  };

  // 检查当前选择的模型是否在可用模型列表中
  const isCurrentModelAvailable = config.model && models.includes(config.model);

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="api-settings-modal">
        <div className="modal-header">
          <h2>AI 连接配置</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="tip-box">
            <p><strong>提示</strong>: 视频功能正在测试中，推荐使用 
              <code>gemini-2.5-live</code> 或 <code>gpt-4-vision-preview</code>。
            </p>
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

          <hr className="divider" />

          <div className="form-group toggle-group">
            <div className="toggle-label">
              <label htmlFor="background-activity-switch">
                智能角色活跃模式
                <p className="warning-text">
                  注意：开启后AI会主动互动，可能增加使用费用
                </p>
              </label>
            </div>
            <input
              type="checkbox"
              id="background-activity-switch"
              checked={backgroundActivity}
              onChange={(e) => handleBackgroundActivityChange(e.target.checked)}
            />
          </div>

          <div className="form-group toggle-group">
            <div className="toggle-label">
              <label htmlFor="background-interval-input">
                活跃检测频率
                <p className="info-text">
                  推荐 60-300 秒，数值越大越省费用，但响应会稍慢
                </p>
              </label>
            </div>
            <input
              type="number"
              id="background-interval-input"
              min="30"
              value={backgroundInterval}
              onChange={(e) => setBackgroundInterval(parseInt(e.target.value) || 60)}
              className="number-input"
            />
          </div>

          <div className="form-group toggle-group">
            <div className="toggle-label">
              <label htmlFor="max-memory-input">
                最大聊天记录
                <p className="info-text">
                  每个聊天保留的最大消息数量，数值越大记忆越完整但性能稍慢
                </p>
              </label>
            </div>
            <input
              type="number"
              id="max-memory-input"
              min="5"
              max="100"
              value={maxMemory}
              onChange={(e) => setMaxMemory(parseInt(e.target.value) || 20)}
              className="number-input"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button className="save-btn" onClick={handleSave}>保存配置</button>
        </div>
      </div>
    </div>
  );
} 