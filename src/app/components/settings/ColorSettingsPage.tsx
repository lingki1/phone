'use client';

import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../types/theme';
import ThemePreview from './ThemePreview';
import './ColorSettingsPage.css';

interface ColorSettingsPageProps {
  onBack: () => void;
}

export default function ColorSettingsPage({ onBack }: ColorSettingsPageProps) {
  const { 
    currentTheme, 
    availableThemes, 
    isLoading, 
    setTheme,
    categories 
  } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('basic');

  // 根据分类过滤主题
  const getThemesByCategory = (categoryId: string): Theme[] => {
    return availableThemes.filter(theme => theme.category === categoryId);
  };

  // 处理主题选择
  const handleThemeSelect = async (themeId: string) => {
    try {
      await setTheme(themeId);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
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



      {/* 分类选择器 */}
      <div className="category-selector">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 主题网格 */}
      <div className="themes-container">
        <div className="themes-grid">
          {getThemesByCategory(selectedCategory).map((theme) => (
            <ThemePreview
              key={theme.id}
              theme={theme}
              isSelected={currentTheme === theme.id}
              isPreview={false}
              onSelect={handleThemeSelect}
              onPreview={() => {}}
              onPreviewEnd={() => {}}
            />
          ))}
        </div>
      </div>


    </div>
  );
}