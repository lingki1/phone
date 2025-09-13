'use client';

import { useState } from 'react';
import { apiConfigManager } from './apiConfigManager';
import { useI18n } from '../../i18n/I18nProvider';
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
  const { t } = useI18n();
  const [configName, setConfigName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!configName.trim()) {
      alert(t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.errors.enterConfigName', '请输入配置名称'));
      return;
    }

    if (!currentConfig.proxyUrl || !currentConfig.apiKey || !currentConfig.model) {
      alert(t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.errors.completeApiConfig', '请先完成API配置'));
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

      alert(t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.success.configSaved', '配置保存成功！'));
      setConfigName('');
      onSave();
      onClose();
    } catch (error) {
      console.error(t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.logs.saveFailed', '保存配置失败:'), error);
      alert(t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.errors.saveFailed', '保存配置失败，请重试'));
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
          <h3>{t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.title', '保存API配置')}</h3>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        
        <div className="dialog-body">
          <div className="form-group">
            <label htmlFor="config-name">{t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.labels.configName', '配置名称')}</label>
            <input
              type="text"
              id="config-name"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder={t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.placeholders.configName', '输入一个便于识别的名称，如：OpenAI官方、Claude API等')}
              maxLength={50}
            />
            <small className="field-hint">{t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.hints.configName', '建议使用有意义的名称，便于后续识别和管理')}</small>
          </div>

          <div className="config-preview">
            <h4>{t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.preview.title', '当前配置预览')}</h4>
            <div className="preview-item">
              <span className="preview-label">{t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.preview.serverAddress', '服务器地址:')}</span>
              <span className="preview-value">{currentConfig.proxyUrl || t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.preview.notSet', '未设置')}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">{t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.preview.apiKey', 'API密钥:')}</span>
              <span className="preview-value">
                {currentConfig.apiKey 
                  ? `${currentConfig.apiKey.substring(0, 8)}...${currentConfig.apiKey.substring(currentConfig.apiKey.length - 4)}`
                  : t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.preview.notSet', '未设置')
                }
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">{t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.preview.aiModel', 'AI模型:')}</span>
              <span className="preview-value">{currentConfig.model || t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.preview.notSelected', '未选择')}</span>
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="cancel-btn" onClick={handleClose}>{t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.buttons.cancel', '取消')}</button>
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={isSaving || !configName.trim()}
          >
            {isSaving ? t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.buttons.saving', '保存中...') : t('QQ.ChatInterface.Me.ApiSaving.SaveConfigDialog.buttons.save', '保存配置')}
          </button>
        </div>
      </div>
    </div>
  );
}
