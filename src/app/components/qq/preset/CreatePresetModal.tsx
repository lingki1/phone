'use client';

import React, { useState } from 'react';
import { PresetConfig, PresetTemplate } from '../../../types/preset';
import { useI18n } from '../../i18n/I18nProvider';
import './CreatePresetModal.css';

interface CreatePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (preset: Omit<PresetConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCreateFromTemplate: (templateId: string, customName?: string) => void;
  templates: PresetTemplate[];
}

export default function CreatePresetModal({
  isOpen,
  onClose,
  onCreate,
  onCreateFromTemplate,
  templates
}: CreatePresetModalProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'template' | 'custom'>('template');
  const [customName, setCustomName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const handleCreateFromTemplate = () => {
    if (!selectedTemplate) {
      alert(t('Preset.CreatePresetModal.errors.selectTemplate', '请选择一个模板'));
      return;
    }
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      alert(t('Preset.CreatePresetModal.errors.templateNotFound', '模板不存在'));
      return;
    }

    const presetName = customName.trim() || template.name;
    onCreateFromTemplate(selectedTemplate, presetName);
    handleClose();
  };

  const handleCreateCustom = () => {
    if (!customName.trim()) {
      alert(t('Preset.CreatePresetModal.errors.enterPresetName', '请输入预设名称'));
      return;
    }

    // 创建默认的自定义预设
    const customPreset: Omit<PresetConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: customName.trim(),
      description: t('Preset.CreatePresetModal.defaultDescription', '自定义预设配置'),
      temperature: 0.7,
      maxTokens: 8000,
      topP: 0.8,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      isDefault: false
    };

    onCreate(customPreset);
    handleClose();
  };

  const handleClose = () => {
    setActiveTab('template');
    setCustomName('');
    setSelectedTemplate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-preset-overlay" onClick={handleClose}>
      <div className="create-preset-modal" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="modal-header">
          <h2>{t('Preset.CreatePresetModal.title', '创建新预设')}</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {/* Tab switching */}
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'template' ? 'active' : ''}`}
            onClick={() => setActiveTab('template')}
          >
            🎯 {t('Preset.CreatePresetModal.tabs.fromTemplate', '从模板创建')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            ⚙️ {t('Preset.CreatePresetModal.tabs.customCreate', '自定义创建')}
          </button>
        </div>

        {/* Template creation tab */}
        {activeTab === 'template' && (
          <div className="tab-content">
            <div className="template-section">
              <h3>{t('Preset.CreatePresetModal.templateSection.title', '选择模板')}</h3>
              <p className="section-description">
                {t('Preset.CreatePresetModal.templateSection.description', '选择一个预设模板作为起点，然后自定义名称')}
              </p>
              
              <div className="template-grid">
                {templates.map(template => (
                  <div 
                    key={template.id}
                    className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="template-icon">
                      {template.category === 'creative' && '🎨'}
                      {template.category === 'balanced' && '⚖️'}
                      {template.category === 'precise' && '🎯'}
                      {template.category === 'concise' && '📝'}
                      {template.category === 'detailed' && '📊'}
                    </div>
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                      <div className="template-params">
                        <span>{t('Preset.CreatePresetModal.templateSection.temperature', '温度')}: {template.config.temperature}</span>
                        <span>{t('Preset.CreatePresetModal.templateSection.tokens', '令牌')}: {template.config.maxTokens}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="custom-name-section">
              <h3>{t('Preset.CreatePresetModal.customNameSection.title', '自定义名称')}</h3>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={t('Preset.CreatePresetModal.customNameSection.placeholder', '输入预设名称（可选，留空使用模板名称）')}
                className="name-input"
                maxLength={50}
              />
            </div>
          </div>
        )}

        {/* Custom creation tab */}
        {activeTab === 'custom' && (
          <div className="tab-content">
            <div className="custom-section">
              <h3>{t('Preset.CreatePresetModal.customSection.title', '创建自定义预设')}</h3>
              <p className="section-description">
                {t('Preset.CreatePresetModal.customSection.description', '创建一个全新的预设配置，稍后可以编辑详细参数')}
              </p>
              
              <div className="form-group">
                <label htmlFor="custom-preset-name">{t('Preset.CreatePresetModal.customSection.presetName', '预设名称')}</label>
                <input
                  type="text"
                  id="custom-preset-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t('Preset.CreatePresetModal.customSection.namePlaceholder', '输入预设名称')}
                  className="name-input"
                  maxLength={50}
                />
              </div>

              <div className="preset-preview">
                <h4>{t('Preset.CreatePresetModal.preview.title', '预设预览')}</h4>
                <div className="preview-card">
                  <div className="preview-header">
                    <span className="preview-name">{customName || t('Preset.CreatePresetModal.preview.unnamed', '未命名预设')}</span>
                    <span className="preview-type">{t('Preset.CreatePresetModal.preview.customType', '自定义')}</span>
                  </div>
                  <div className="preview-description">
                    {t('Preset.CreatePresetModal.preview.description', '自定义预设配置，创建后可编辑详细参数')}
                  </div>
                  <div className="preview-params">
                    <span>{t('Preset.CreatePresetModal.preview.temperature', '温度')}: 0.7</span>
                    <span>{t('Preset.CreatePresetModal.preview.maxTokens', '最大令牌')}: 1500</span>
                    <span>Top P: 0.8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal footer */}
        <div className="modal-footer">
          <button 
            className="cancel-btn"
            onClick={handleClose}
          >
            {t('Preset.CreatePresetModal.buttons.cancel', '取消')}
          </button>
          <button 
            className="create-btn"
            onClick={activeTab === 'template' ? handleCreateFromTemplate : handleCreateCustom}
            disabled={activeTab === 'template' ? !selectedTemplate : !customName.trim()}
          >
            {activeTab === 'template' ? t('Preset.CreatePresetModal.buttons.createFromTemplate', '从模板创建') : t('Preset.CreatePresetModal.buttons.createPreset', '创建预设')}
          </button>
        </div>
      </div>
    </div>
  );
} 