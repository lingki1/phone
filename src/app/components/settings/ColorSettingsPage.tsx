'use client';

import React, { useState, useEffect } from 'react';
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
    previewTheme, 
    cancelPreview,
    categories 
  } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>('basic');
  const [previewThemeId, setPreviewThemeId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // 根据分类过滤主题
  const getThemesByCategory = (categoryId: string): Theme[] => {
    return availableThemes.filter(theme => theme.category === categoryId);
  };

  // 处理主题选择
  const handleThemeSelect = async (themeId: string) => {
    if (isApplying) return;
    
    try {
      setIsApplying(true);
      await setTheme(themeId);
      setPreviewThemeId(null);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // 处理主题预览
  const handleThemePreview = (themeId: string) => {
    if (themeId === currentTheme) return;
    
    setPreviewThemeId(themeId);
    previewTheme(themeId);
  };

  // 处理预览结束
  const handlePreviewEnd = () => {
    setPreviewThemeId(null);
    cancelPreview();
  };

  // 组件卸载时取消预览
  useEffect(() => {
    return () => {
      if (previewThemeId) {
        cancelPreview();
      }
    };
  }, [previewThemeId, cancelPreview]);

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

      {/* 预览提示 */}
      {previewThemeId && (
        <div className="preview-banner">
          <div className="preview-info">
            <span className="preview-icon">👀</span>
            <span className="preview-text">
              正在预览主题，点击&quot;应用&quot;确认更改或点击其他主题取消
            </span>
          </div>
          <button 
            className="preview-cancel-btn"
            onClick={handlePreviewEnd}
          >
            取消预览
          </button>
        </div>
      )}

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
              isPreview={previewThemeId === theme.id}
              onSelect={handleThemeSelect}
              onPreview={handleThemePreview}
              onPreviewEnd={handlePreviewEnd}
            />
          ))}
        </div>
      </div>

      {/* 当前主题信息 */}
      <div className="current-theme-info">
        <div className="current-theme-label">当前主题</div>
        <div className="current-theme-details">
          {(() => {
            const current = availableThemes.find(t => t.id === currentTheme);
            return current ? (
              <>
                <div className="current-theme-name">{current.name}</div>
                <div className="current-theme-description">{current.description}</div>
              </>
            ) : (
              <div className="current-theme-name">未知主题</div>
            );
          })()}
        </div>
      </div>

      {/* 应用中遮罩 */}
      {isApplying && (
        <div className="applying-overlay">
          <div className="applying-content">
            <div className="applying-spinner"></div>
            <p>正在应用主题...</p>
          </div>
        </div>
      )}
    </div>
  );
}