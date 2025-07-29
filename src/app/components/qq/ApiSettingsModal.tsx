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
          <h2>🤖 AI 连接配置</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="tip-box">
            <p>🎯 <strong>小贴士</strong>: 想要体验图片识别功能？记得选择支持视觉的AI模型哦！推荐使用 
              <code>gpt-4o</code> 或 <code>gpt-4-vision-preview</code>。
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="proxy-url">🌐 服务器地址</label>
            <input
              type="text"
              id="proxy-url"
              value={config.proxyUrl}
              onChange={(e) => handleInputChange('proxyUrl', e.target.value)}
              placeholder="输入你的AI服务地址，例如: https://api.openai.com"
            />
            <small className="field-hint">💡 不需要添加 /v1 后缀，系统会自动处理</small>
          </div>

          <div className="form-group">
            <label htmlFor="api-key">🔑 访问密钥</label>
            <input
              type="password"
              id="api-key"
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder="输入你的API密钥，以 sk- 开头"
            />
            <small className="field-hint">🔒 密钥会被安全保存，不会泄露给他人</small>
          </div>

          <div className="form-group">
            <label htmlFor="model-select">🧠 AI 模型选择</label>
            <select
              id="model-select"
              value={config.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
            >
              <option value="">点击选择你喜欢的AI模型</option>
              {models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <small className="field-hint">✨ 不同模型有不同的特点和能力</small>
          </div>

          <button 
            className="fetch-models-btn" 
            onClick={fetchModels}
            disabled={isLoadingModels}
          >
            {isLoadingModels ? '🔄 正在获取模型列表...' : '📋 获取可用模型'}
          </button>

          <hr className="divider" />

          <div className="form-group toggle-group">
            <div className="toggle-label">
              <label htmlFor="background-activity-switch">
                🎭 智能角色活跃模式
                <p className="warning-text">
                  ⚠️ 注意：开启后AI会主动互动，可能增加使用费用
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
                ⏰ 活跃检测频率
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
              <label htmlFor="block-cooldown-input">
                🕐 AI 冷静恢复时间
                <p className="info-text">
                  被拒绝后，AI需要等待多久才能重新申请好友
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
          <button className="cancel-btn" onClick={onClose}>❌ 取消</button>
          <button className="save-btn" onClick={handleSave}>✅ 保存配置</button>
        </div>
      </div>
    </div>
  );
} 