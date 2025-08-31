'use client';

import { useState } from 'react';
import { apiConfigManager } from './apiConfigManager';
import './SaveConfigDialog.css';

interface SaveConfigDialogProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: () => void;
  currentConfig: {
    proxyUrl: string;
    apiKey: string;
    model: string;
  };
}

export default function SaveConfigDialog({
  isVisible,
  onClose,
  onSave,
  currentConfig
}: SaveConfigDialogProps) {
  const [configName, setConfigName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!configName.trim()) {
      alert('请输入配置名称');
      return;
    }

    if (!currentConfig.proxyUrl || !currentConfig.apiKey || !currentConfig.model) {
      alert('请先完成API配置');
      return;
    }

    setIsSaving(true);
    try {
      await apiConfigManager.saveConfig({
        name: configName.trim(),
        proxyUrl: currentConfig.proxyUrl,
        apiKey: currentConfig.apiKey,
        model: currentConfig.model
      });

      alert('配置保存成功！');
      setConfigName('');
      onSave();
      onClose();
    } catch (error) {
      console.error('保存配置失败:', error);
      alert('保存配置失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setConfigName('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="save-config-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="save-config-dialog">
        <div className="dialog-header">
          <h3>保存API配置</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="dialog-body">
          <div className="form-group">
            <label htmlFor="config-name">配置名称</label>
            <input
              type="text"
              id="config-name"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="输入一个便于识别的名称，如：OpenAI官方、Claude API等"
              maxLength={50}
            />
            <small className="field-hint">建议使用有意义的名称，便于后续识别和管理</small>
          </div>

          <div className="config-preview">
            <h4>当前配置预览</h4>
            <div className="preview-item">
              <span className="preview-label">服务器地址:</span>
              <span className="preview-value">{currentConfig.proxyUrl || '未设置'}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">API密钥:</span>
              <span className="preview-value">
                {currentConfig.apiKey 
                  ? `${currentConfig.apiKey.substring(0, 8)}...${currentConfig.apiKey.substring(currentConfig.apiKey.length - 4)}`
                  : '未设置'
                }
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">AI模型:</span>
              <span className="preview-value">{currentConfig.model || '未选择'}</span>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="cancel-btn" onClick={handleClose}>取消</button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={isSaving || !configName.trim()}
          >
            {isSaving ? '保存中...' : '保存配置'}
          </button>
        </div>
      </div>
    </div>
  );
}
