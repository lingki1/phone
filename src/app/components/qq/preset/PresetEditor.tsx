'use client';

import React, { useState, useEffect } from 'react';
import { PresetConfig } from '../../../types/preset';
import { presetManager } from '../../../utils/presetManager';
import { useI18n } from '../../i18n/I18nProvider';
import './PresetEditor.css';

interface PresetEditorProps {
  isOpen: boolean;
  preset: PresetConfig;
  onClose: () => void;
  onSave: (preset: PresetConfig) => void;
}

export default function PresetEditor({
  isOpen,
  preset,
  onClose,
  onSave
}: PresetEditorProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState<PresetConfig>(preset);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(preset);
    setErrors([]);
  }, [preset]);

  const handleInputChange = (field: keyof PresetConfig, value: string | number | boolean | string[] | Record<string, number> | 'text' | 'json_object' | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberInputChange = (field: keyof PresetConfig, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      handleInputChange(field, numValue);
    } else if (value === '') {
      handleInputChange(field, 0);
    }
  };

  const validateForm = (): boolean => {
    const validationErrors = presetManager.validatePreset(formData);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const updatedPreset = {
        ...formData,
        updatedAt: Date.now()
      };
      onSave(updatedPreset);
    } catch (error) {
      console.error('Failed to save preset:', error);
      setErrors([t('Preset.PresetEditor.errors.saveFailed', '保存失败，请重试')]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(preset);
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="preset-editor-overlay" onClick={handleCancel}>
      <div className="preset-editor-modal" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="modal-header">
          <h2>{t('Preset.PresetEditor.title', '编辑预设')}</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="error-list">
            {errors.map((error, index) => (
              <div key={index} className="error-item">⚠️ {error}</div>
            ))}
          </div>
        )}

        {/* Form content */}
        <div className="modal-body">
          {/* Basic information */}
          <div className="form-section">
            <h3>{t('Preset.PresetEditor.sections.basicInfo', '基本信息')}</h3>
            <div className="form-group">
              <label htmlFor="preset-name">{t('Preset.PresetEditor.fields.presetName', '预设名称')}</label>
              <input
                type="text"
                id="preset-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder={t('Preset.PresetEditor.fields.presetNamePlaceholder', '输入预设名称')}
                maxLength={50}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="preset-description">{t('Preset.PresetEditor.fields.description', '描述')}</label>
              <textarea
                id="preset-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('Preset.PresetEditor.fields.descriptionPlaceholder', '描述这个预设的用途和特点')}
                rows={3}
                maxLength={200}
              />
            </div>
          </div>

          {/* Core parameters */}
          <div className="form-section">
            <h3>{t('Preset.PresetEditor.sections.coreParams', '核心参数')}</h3>
            
            <div className="form-group">
              <label htmlFor="temperature">
                {t('Preset.PresetEditor.fields.temperature', '温度 (Temperature)')}
                <span className="param-hint">{t('Preset.PresetEditor.hints.temperature', '控制输出的随机性，0-2')}</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className="slider"
                />
                <input
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => handleNumberInputChange('temperature', e.target.value)}
                  min="0"
                  max="2"
                  step="0.1"
                  className="number-input"
                />
              </div>
              <div className="param-explanation">
                {t('Preset.PresetEditor.explanations.temperature', '较低的值使输出更确定，较高的值使输出更随机')}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="max-tokens">
                {t('Preset.PresetEditor.fields.maxTokens', '最大令牌数 (Max Tokens)')}
                <span className="param-hint">{t('Preset.PresetEditor.hints.maxTokens', '限制回复的最大长度')}</span>
              </label>
              <input
                type="number"
                id="max-tokens"
                value={formData.maxTokens}
                onChange={(e) => handleNumberInputChange('maxTokens', e.target.value)}
                min="0"
                max="63000"
                className="number-input"
              />
              <div className="param-explanation">
                {t('Preset.PresetEditor.explanations.maxTokens', '控制AI回复的最大长度，建议范围：100-63000，0表示无限制')}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="top-p">
                Top P
                <span className="param-hint">{t('Preset.PresetEditor.hints.topP', '控制词汇选择的多样性，0-1')}</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="top-p"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.topP}
                  onChange={(e) => handleInputChange('topP', parseFloat(e.target.value))}
                  className="slider"
                />
                <input
                  type="number"
                  value={formData.topP}
                  onChange={(e) => handleNumberInputChange('topP', e.target.value)}
                  min="0"
                  max="1"
                  step="0.1"
                  className="number-input"
                />
              </div>
              <div className="param-explanation">
                {t('Preset.PresetEditor.explanations.topP', '控制词汇选择的多样性，1.0表示考虑所有词汇')}
              </div>
            </div>
          </div>

          {/* Penalty parameters */}
          <div className="form-section">
            <h3>{t('Preset.PresetEditor.sections.penaltyParams', '惩罚参数')}</h3>
            
            <div className="form-group">
              <label htmlFor="frequency-penalty">
                {t('Preset.PresetEditor.fields.frequencyPenalty', '频率惩罚 (Frequency Penalty)')}
                <span className="param-hint">{t('Preset.PresetEditor.hints.frequencyPenalty', '减少重复词汇的使用，-2.0 到 2.0')}</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="frequency-penalty"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={formData.frequencyPenalty}
                  onChange={(e) => handleInputChange('frequencyPenalty', parseFloat(e.target.value))}
                  className="slider"
                />
                <input
                  type="number"
                  value={formData.frequencyPenalty}
                  onChange={(e) => handleNumberInputChange('frequencyPenalty', e.target.value)}
                  min="-2"
                  max="2"
                  step="0.1"
                  className="number-input"
                />
              </div>
              <div className="param-explanation">
                {t('Preset.PresetEditor.explanations.frequencyPenalty', '正值减少重复词汇，负值增加重复词汇')}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="presence-penalty">
                {t('Preset.PresetEditor.fields.presencePenalty', '存在惩罚 (Presence Penalty)')}
                <span className="param-hint">{t('Preset.PresetEditor.hints.presencePenalty', '减少新话题的引入，-2.0 到 2.0')}</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  id="presence-penalty"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={formData.presencePenalty}
                  onChange={(e) => handleInputChange('presencePenalty', parseFloat(e.target.value))}
                  className="slider"
                />
                <input
                  type="number"
                  value={formData.presencePenalty}
                  onChange={(e) => handleNumberInputChange('presencePenalty', e.target.value)}
                  min="-2"
                  max="2"
                  step="0.1"
                  className="number-input"
                />
              </div>
              <div className="param-explanation">
                {t('Preset.PresetEditor.explanations.presencePenalty', '正值减少新话题，负值鼓励探索新话题')}
              </div>
            </div>
          </div>

          {/* Advanced parameters */}
          <div className="form-section">
            <h3>{t('Preset.PresetEditor.sections.advancedParams', '高级参数')}</h3>
            
            <div className="form-group">
              <label htmlFor="top-k">
                Top K {t('Preset.PresetEditor.fields.optional', '(可选)')}
                <span className="param-hint">{t('Preset.PresetEditor.hints.topK', '限制词汇选择范围')}</span>
              </label>
              <input
                type="number"
                id="top-k"
                value={formData.topK || ''}
                onChange={(e) => handleInputChange('topK', e.target.value ? parseInt(e.target.value) : undefined)}
                min="1"
                max="100"
                className="number-input"
                placeholder={t('Preset.PresetEditor.fields.topKPlaceholder', '留空使用默认值')}
              />
              <div className="param-explanation">
                {t('Preset.PresetEditor.explanations.topK', '限制每次选择词汇时考虑的词汇数量')}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="response-format">{t('Preset.PresetEditor.fields.responseFormat', '响应格式')}</label>
              <select
                id="response-format"
                value={formData.responseFormat || 'text'}
                onChange={(e) => handleInputChange('responseFormat', e.target.value)}
                className="select-input"
              >
                <option value="text">{t('Preset.PresetEditor.options.textFormat', '文本格式')}</option>
                <option value="json_object">{t('Preset.PresetEditor.options.jsonFormat', 'JSON格式')}</option>
              </select>
              <div className="param-explanation">
                {t('Preset.PresetEditor.explanations.responseFormat', '控制AI回复的格式，JSON格式适合结构化数据')}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="seed">
                {t('Preset.PresetEditor.fields.seed', '随机种子')} {t('Preset.PresetEditor.fields.optional', '(可选)')}
                <span className="param-hint">{t('Preset.PresetEditor.hints.seed', '确保结果的可重现性')}</span>
              </label>
              <input
                type="number"
                id="seed"
                value={formData.seed || ''}
                onChange={(e) => handleInputChange('seed', e.target.value ? parseInt(e.target.value) : undefined)}
                min="1"
                max="2147483647"
                className="number-input"
                placeholder={t('Preset.PresetEditor.fields.seedPlaceholder', '留空使用随机种子')}
              />
              <div className="param-explanation">
                {t('Preset.PresetEditor.explanations.seed', '设置随机种子以获得可重现的结果')}
              </div>
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="modal-footer">
          <button 
            className="cancel-btn"
            onClick={handleCancel}
            disabled={isSaving}
          >
            {t('Preset.PresetEditor.buttons.cancel', '取消')}
          </button>
          <button 
            className="save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t('Preset.PresetEditor.buttons.saving', '保存中...') : t('Preset.PresetEditor.buttons.save', '保存预设')}
          </button>
        </div>
      </div>
    </div>
  );
} 