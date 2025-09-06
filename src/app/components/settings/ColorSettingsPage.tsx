'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/themeManager';
import { themeManager } from '../../utils/themeManager';
import ThemePreview from './ThemePreview';
import CustomThemeEditor from '../theme/CustomThemeEditor';
import './ColorSettingsPage.css';

interface ColorSettingsPageProps {
  onBack: () => void;
}

export default function ColorSettingsPage({ onBack }: ColorSettingsPageProps) {
  const { 
    currentTheme, 
    allThemes,
    isLoading, 
    setTheme,
    categories,
    refreshThemes
  } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('basic');
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | undefined>(undefined);

  // 监听自定义主题保存事件
  useEffect(() => {
    const handleCustomThemeSaved = async () => {
      // 自动刷新主题列表
      await refreshThemes();
      // 如果当前在自定义主题分类，保持在该分类
      if (selectedCategory === 'custom') {
        // 主题列表已刷新，会自动显示新保存的主题
      }
    };

    window.addEventListener('customThemeSaved', handleCustomThemeSaved);
    
    return () => {
      window.removeEventListener('customThemeSaved', handleCustomThemeSaved);
    };
  }, [refreshThemes, selectedCategory]);

  // 根据分类过滤主题
  const getThemesByCategory = (categoryId: string): Theme[] => {
    return allThemes.filter(theme => theme.category === categoryId);
  };

  // 处理主题选择
  const handleThemeSelect = async (themeId: string) => {
    try {
      await setTheme(themeId);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  // 处理新建自定义主题
  const handleCreateCustomTheme = () => {
    setEditingTheme(undefined);
    setShowCustomEditor(true);
  };

  // 处理编辑自定义主题
  const handleEditCustomTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setShowCustomEditor(true);
  };

  // 处理保存自定义主题
  const handleSaveCustomTheme = async (_theme: Theme) => {
    try {
      // 注意：CustomThemeEditor已经调用了themeManager.saveCustomTheme
      // 这里不需要重复调用，只需要处理UI更新
      
      // 重新加载主题列表
      await refreshThemes();
      
      // 自动切换到自定义主题分类，让用户看到新保存的主题
      setSelectedCategory('custom');
      setShowCustomEditor(false);
      setEditingTheme(undefined);
    } catch (error) {
      console.error('Failed to handle custom theme save:', error);
    }
  };

  // 处理删除自定义主题
  const handleDeleteCustomTheme = async (themeId: string) => {
    if (confirm('确定要删除这个自定义主题吗？')) {
      try {
        await themeManager.deleteCustomTheme(themeId);
        // 重新加载主题列表
        await refreshThemes();
      } catch (error) {
        console.error('Failed to delete custom theme:', error);
      }
    }
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setShowCustomEditor(false);
    setEditingTheme(undefined);
  };

  if (isLoading) {
    return (
      <div className="color-settings-page">
        <div className="color-settings-header">
          <button className="back-button" onClick={onBack}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="page-title">配色设置</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>正在加载主题...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="color-settings-page">
      {/* 页面头部 */}
      <div className="color-settings-header">
        <button className="back-button" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="page-title">配色设置</h1>
      </div>



      {/* 主题分类选择器 */}
      <div className="theme-category-selector">
        {categories.map(category => (
          <button
            key={category.id}
            className={`theme-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 主题网格 */}
      <div className="themes-container">
        {/* 自定义主题分类的特殊处理 */}
        {selectedCategory === 'custom' && (
          <div className="custom-theme-actions">
            <button 
              className="create-custom-theme-btn"
              onClick={handleCreateCustomTheme}
            >
              <span className="btn-icon">+</span>
              <span className="btn-text">新建自定义主题</span>
            </button>
          </div>
        )}

        <div className="themes-grid">
          {getThemesByCategory(selectedCategory).map((theme) => (
            <div key={theme.id} className="theme-item-wrapper">
              <ThemePreview
                theme={theme}
                isSelected={currentTheme === theme.id}
                isPreview={false}
                onSelect={handleThemeSelect}
                onPreview={() => {}}
                onPreviewEnd={() => {}}
              />
              {/* 自定义主题的操作按钮 */}
              {theme.isCustom && (
                <div className="custom-theme-actions">
                  <button 
                    className="edit-theme-btn"
                    onClick={() => handleEditCustomTheme(theme)}
                    title="编辑主题"
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-theme-btn"
                    onClick={() => handleDeleteCustomTheme(theme.id)}
                    title="删除主题"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 自定义主题编辑器 */}
      {showCustomEditor && (
        <div className="custom-editor-overlay">
          <div className="custom-editor-container">
            <CustomThemeEditor
              onSave={handleSaveCustomTheme}
              onCancel={handleCancelEdit}
              editingTheme={editingTheme}
            />
          </div>
        </div>
      )}


    </div>
  );
}