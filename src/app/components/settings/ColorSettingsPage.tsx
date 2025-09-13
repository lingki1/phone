'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../utils/themeManager';
import { themeManager } from '../../utils/themeManager';
import { useI18n } from '../i18n/I18nProvider';
import ThemePreview from './ThemePreview';
import CustomThemeEditor from '../theme/CustomThemeEditor';
import './ColorSettingsPage.css';

interface ColorSettingsPageProps {
  onBack: () => void;
}

export default function ColorSettingsPage({ onBack }: ColorSettingsPageProps) {
  const { t } = useI18n();
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

  // Listen to custom theme save events
  useEffect(() => {
    const handleCustomThemeSaved = async () => {
      // Automatically refresh theme list
      await refreshThemes();
      // If currently in custom theme category, stay in that category
      if (selectedCategory === 'custom') {
        // Theme list has been refreshed, will automatically show newly saved theme
      }
    };

    window.addEventListener('customThemeSaved', handleCustomThemeSaved);
    
    return () => {
      window.removeEventListener('customThemeSaved', handleCustomThemeSaved);
    };
  }, [refreshThemes, selectedCategory]);

  // Filter themes by category
  const getThemesByCategory = (categoryId: string): Theme[] => {
    return allThemes.filter(theme => theme.category === categoryId);
  };

  // Handle theme selection
  const handleThemeSelect = async (themeId: string) => {
    try {
      await setTheme(themeId);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  // Handle creating new custom theme
  const handleCreateCustomTheme = () => {
    setEditingTheme(undefined);
    setShowCustomEditor(true);
  };

  // Handle editing custom theme
  const handleEditCustomTheme = (theme: Theme) => {
    setEditingTheme(theme);
    setShowCustomEditor(true);
  };

  // Handle saving custom theme
  const handleSaveCustomTheme = async (_theme: Theme) => {
    try {
      // Note: CustomThemeEditor has already called themeManager.saveCustomTheme
      // No need to call again here, just handle UI updates
      
      // Reload theme list
      await refreshThemes();
      
      // Automatically switch to custom theme category to let user see newly saved theme
      setSelectedCategory('custom');
      setShowCustomEditor(false);
      setEditingTheme(undefined);
    } catch (error) {
      console.error('Failed to handle custom theme save:', error);
    }
  };

  // Handle deleting custom theme
  const handleDeleteCustomTheme = async (themeId: string) => {
    if (confirm(t('Settings.ColorSettingsPage.confirm.deleteCustomTheme', '确定要删除这个自定义主题吗？'))) {
      try {
        await themeManager.deleteCustomTheme(themeId);
        // Reload theme list
        await refreshThemes();
      } catch (error) {
        console.error('Failed to delete custom theme:', error);
      }
    }
  };

  // Handle cancel editing
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
          <h1 className="page-title">{t('Settings.ColorSettingsPage.title', '配色设置')}</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('Settings.ColorSettingsPage.loading', '正在加载主题...')}</p>
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
        <h1 className="page-title">{t('Settings.ColorSettingsPage.title', '配色设置')}</h1>
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
              <span className="btn-text">{t('Settings.ColorSettingsPage.buttons.createCustomTheme', '新建自定义主题')}</span>
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
                    title={t('Settings.ColorSettingsPage.buttons.editTheme', '编辑主题')}
                  >
                    ✏️
                  </button>
                  <button 
                    className="delete-theme-btn"
                    onClick={() => handleDeleteCustomTheme(theme.id)}
                    title={t('Settings.ColorSettingsPage.buttons.deleteTheme', '删除主题')}
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