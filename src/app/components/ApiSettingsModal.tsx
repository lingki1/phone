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
  const [blockCooldown, setBlockCooldown] = useState(1);

  useEffect(() => {
    if (isVisible) {
      setConfig(currentConfig);
      // 从localStorage加载其他设置
      const savedSettings = localStorage.getItem('globalSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setBackgroundActivity(settings.enableBackgroundActivity || false);
        setBackgroundInterval(settings.backgroundActivityInterval || 60);
        setBlockCooldown(settings.blockCooldownHours || 1);
      }
    }
  }, [isVisible, currentConfig]);

  const handleInputChange = (field: keyof ApiConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
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
      setModels(modelList);
      
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
      blockCooldownHours: blockCooldown
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

  if (!isVisible) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="api-settings-modal">
        <div className="modal-header">
          <h2>API 设置</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="tip-box">
            <p>💡 提示: 若要使用&quot;发送图片&quot;功能, 请务必选择支持Vision(视觉)的模型, 如 
              <code>gpt-4o</code> 或 <code>gpt-4-vision-preview</code>。
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="proxy-url">反代地址 (不需要添加/v1噢~)</label>
            <input
              type="text"
              id="proxy-url"
              value={config.proxyUrl}
              onChange={(e) => handleInputChange('proxyUrl', e.target.value)}
              placeholder="例如: https://api.openai.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="api-key">密钥 (API Key)</label>
            <input
              type="password"
              id="api-key"
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder="sk-..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="model-select">模型</label>
            <select
              id="model-select"
              value={config.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
            >
              <option value="">请选择模型</option>
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          <button 
            className="fetch-models-btn" 
            onClick={fetchModels}
            disabled={isLoadingModels}
          >
            {isLoadingModels ? '拉取中...' : '拉取模型'}
          </button>

          <hr className="divider" />

          <div className="form-group toggle-group">
            <div className="toggle-label">
              <label htmlFor="background-activity-switch">
                启用后台角色活动
                <p className="warning-text">
                  警告：此功能会显著增加API调用和费用！
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
                后台活动检测间隔 (秒)
                <p className="info-text">
                  建议值 60-300。值越大，费用越低，但角色反应越慢。
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
              <label htmlFor="block-cooldown-input">
                AI被拉黑后冷静期 (小时)
                <p className="info-text">
                  被拉黑超过这个时间后，AI才有几率重新申请好友。
                </p>
              </label>
            </div>
            <input
              type="number"
              id="block-cooldown-input"
              min="0.1"
              step="0.1"
              value={blockCooldown}
              onChange={(e) => setBlockCooldown(parseFloat(e.target.value) || 1)}
              className="number-input"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button className="save-btn" onClick={handleSave}>保存设置</button>
        </div>
      </div>
    </div>
  );
} 