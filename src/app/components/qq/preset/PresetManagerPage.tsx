'use client';

import React, { useState, useEffect } from 'react';
import { PresetConfig } from '../../../types/preset';
import { presetManager, DEFAULT_PRESET_TEMPLATES } from '../../../utils/presetManager';
import PresetCard from '@/app/components/qq/preset/PresetCard';
import PresetEditor from '@/app/components/qq/preset/PresetEditor';
import CreatePresetModal from '@/app/components/qq/preset/CreatePresetModal';
import './PresetManagerPage.css';

interface PresetManagerPageProps {
  onBack: () => void;
}

export default function PresetManagerPage({ onBack }: PresetManagerPageProps) {
  const [presets, setPresets] = useState<PresetConfig[]>([]);
  const [currentPreset, setCurrentPreset] = useState<PresetConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetConfig | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCleaning, setIsCleaning] = useState(false);

  // 加载预设数据
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 初始化默认预设（如果还没有的话）
      await presetManager.initializeDefaultPresets();
      
      // 获取所有预设
      const allPresets = await presetManager.getAllPresets();
      setPresets(allPresets);
      
      // 获取当前预设
      const current = await presetManager.getCurrentPreset();
      setCurrentPreset(current);
      
    } catch (error) {
      console.error('Failed to load presets:', error);
      setError('加载预设失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 设置当前预设
  const handleSetCurrentPreset = async (presetId: string) => {
    try {
      await presetManager.setCurrentPreset(presetId);
      const current = await presetManager.getCurrentPreset();
      setCurrentPreset(current);
    } catch (error) {
      console.error('Failed to set current preset:', error);
      setError('设置当前预设失败');
    }
  };

  // 创建新预设
  const handleCreatePreset = async (presetData: Omit<PresetConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newPreset = await presetManager.createPreset(presetData);
      setPresets(prev => [...prev, newPreset]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create preset:', error);
      setError('创建预设失败');
    }
  };

  // 从模板创建预设
  const handleCreateFromTemplate = async (templateId: string, customName?: string) => {
    try {
      const newPreset = await presetManager.createFromTemplate(templateId, customName);
      setPresets(prev => [...prev, newPreset]);
    } catch (error) {
      console.error('Failed to create preset from template:', error);
      setError('从模板创建预设失败');
    }
  };

  // 更新预设
  const handleUpdatePreset = async (preset: PresetConfig) => {
    try {
      await presetManager.updatePreset(preset);
      setPresets(prev => prev.map(p => p.id === preset.id ? preset : p));
      setEditingPreset(null);
      
      // 如果更新的是当前预设，也要更新当前预设
      if (currentPreset?.id === preset.id) {
        setCurrentPreset(preset);
      }
    } catch (error) {
      console.error('Failed to update preset:', error);
      setError('更新预设失败');
    }
  };

  // 删除预设
  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('确定要删除这个预设吗？此操作不可撤销。')) {
      return;
    }

    try {
      await presetManager.deletePreset(presetId);
      setPresets(prev => prev.filter(p => p.id !== presetId));
      
      // 如果删除的是当前预设，重新加载当前预设
      if (currentPreset?.id === presetId) {
        const current = await presetManager.getCurrentPreset();
        setCurrentPreset(current);
      }
    } catch (error) {
      console.error('Failed to delete preset:', error);
      setError('删除预设失败');
    }
  };

  // 清理重复预设
  const handleCleanupDuplicates = async () => {
    if (!confirm('确定要清理重复的默认预设吗？这将删除重复的系统预设，保留最新的版本。')) {
      return;
    }

    try {
      setIsCleaning(true);
      setError(null);
      
      const result = await presetManager.cleanupDuplicatePresets();
      
      if (result.cleaned > 0) {
        // 重新加载预设列表
        await loadPresets();
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to cleanup duplicate presets:', error);
      setError('清理重复预设失败');
    } finally {
      setIsCleaning(false);
    }
  };

  // 过滤预设
  const filteredPresets = presets.filter(preset => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'custom') return !preset.isDefault;
    return preset.isDefault;
  });

  // 获取分类统计
  const getCategoryStats = () => {
    const stats = {
      all: presets.length,
      custom: presets.filter(p => !p.isDefault).length,
      default: presets.filter(p => p.isDefault).length
    };
    return stats;
  };

  const categoryStats = getCategoryStats();

  if (isLoading) {
    return (
      <div className="preset-manager-page loading">
        <div className="loading-spinner">加载中...</div>
      </div>
    );
  }

  return (
    <div className="preset-manager-page">
      {/* 顶部导航 */}
      <div className="preset-header">
        <button className="header-back-btn" onClick={onBack}>
          <span className="back-icon">‹</span>
        </button>
        <h1 className="header-title">AI 预设管理</h1>
        <div className="header-actions">
          <button 
            className="cleanup-btn"
            onClick={handleCleanupDuplicates}
            disabled={isCleaning}
            title="清理重复的默认预设"
          >
            <span className="btn-icon">🧹</span>
            <span className="btn-text">{isCleaning ? '清理中...' : '清理重复'}</span>
          </button>
          <button 
            className="new-preset-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-icon">+</span>
            <span className="btn-text">新建预设</span>
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* 当前预设显示 - 简化版本 */}
      {currentPreset && (
        <div className="current-preset-section">
          <div className="current-preset-card">
            <div className="preset-info">
              <div className="preset-name">{currentPreset.name}</div>
              <div className="preset-description">{currentPreset.description}</div>
            </div>
            <div className="preset-badge">当前使用</div>
          </div>
        </div>
      )}

      {/* 分类筛选 */}
      <div className="category-filter">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            全部 ({categoryStats.all})
          </button>
          <button 
            className={`filter-tab ${selectedCategory === 'default' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('default')}
          >
            默认 ({categoryStats.default})
          </button>
          <button 
            className={`filter-tab ${selectedCategory === 'custom' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('custom')}
          >
            自定义 ({categoryStats.custom})
          </button>
        </div>
      </div>

      {/* 预设列表 */}
      <div className="presets-container">
        <div className="presets-grid">
          {filteredPresets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⚙️</div>
              <h3>暂无预设</h3>
              <p>创建你的第一个 AI 预设配置</p>
              <button 
                className="create-first-btn"
                onClick={() => setShowCreateModal(true)}
              >
                创建预设
              </button>
            </div>
          ) : (
            filteredPresets.map(preset => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isCurrent={currentPreset?.id === preset.id}
                onSetCurrent={() => handleSetCurrentPreset(preset.id)}
                onEdit={() => setEditingPreset(preset)}
                onDelete={() => handleDeletePreset(preset.id)}
                onDuplicate={() => handleCreateFromTemplate('custom', `${preset.name} (副本)`)}
              />
            ))
          )}
        </div>
      </div>

      {/* 创建预设模态框 */}
      {showCreateModal && (
        <CreatePresetModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePreset}
          onCreateFromTemplate={handleCreateFromTemplate}
          templates={DEFAULT_PRESET_TEMPLATES}
        />
      )}

      {/* 编辑预设模态框 */}
      {editingPreset && (
        <PresetEditor
          isOpen={!!editingPreset}
          preset={editingPreset}
          onClose={() => setEditingPreset(null)}
          onSave={handleUpdatePreset}
        />
      )}
    </div>
  );
} 