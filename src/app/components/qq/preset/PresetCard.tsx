'use client';

import React from 'react';
import { PresetConfig } from '../../../types/preset';
import './PresetCard.css';

interface PresetCardProps {
  preset: PresetConfig;
  isCurrent: boolean;
  onSetCurrent: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function PresetCard({
  preset,
  isCurrent,
  onSetCurrent,
  onEdit,
  onDelete,
  onDuplicate
}: PresetCardProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`preset-card ${isCurrent ? 'current' : ''}`}>
      {/* 预设头部 */}
      <div className="preset-header">
        <div className="preset-title">
          <h3>{preset.name}</h3>
          {preset.isDefault && <span className="default-badge">默认</span>}
          {isCurrent && <span className="current-badge">当前</span>}
        </div>
        <div className="preset-actions">
          <button 
            className="action-btn edit-btn"
            onClick={onEdit}
            title="编辑预设"
          >
            ✏️
          </button>
          <button 
            className="action-btn duplicate-btn"
            onClick={onDuplicate}
            title="复制预设"
          >
            📋
          </button>
          {!preset.isDefault && (
            <button 
              className="action-btn delete-btn"
              onClick={onDelete}
              title="删除预设"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* 预设描述 */}
      <div className="preset-description">
        {preset.description}
      </div>

      {/* 预设参数 */}
      <div className="preset-params">
        <div className="param-group">
          <div className="param-item">
            <span className="param-label">温度</span>
            <span className="param-value">{preset.temperature}</span>
          </div>
          <div className="param-item">
            <span className="param-label">最大令牌</span>
            <span className="param-value">{preset.maxTokens}</span>
          </div>
          <div className="param-item">
            <span className="param-label">Top P</span>
            <span className="param-value">{preset.topP}</span>
          </div>
        </div>
        
        <div className="param-group">
          <div className="param-item">
            <span className="param-label">频率惩罚</span>
            <span className="param-value">{preset.frequencyPenalty}</span>
          </div>
          <div className="param-item">
            <span className="param-label">存在惩罚</span>
            <span className="param-value">{preset.presencePenalty}</span>
          </div>
          {preset.topK && (
            <div className="param-item">
              <span className="param-label">Top K</span>
              <span className="param-value">{preset.topK}</span>
            </div>
          )}
        </div>
      </div>

      {/* 预设底部 */}
      <div className="preset-footer">
        <div className="preset-meta">
          <span className="created-time">
            创建于 {formatTime(preset.createdAt)}
          </span>
          {preset.updatedAt !== preset.createdAt && (
            <span className="updated-time">
              更新于 {formatTime(preset.updatedAt)}
            </span>
          )}
        </div>
        
        {!isCurrent && (
          <button 
            className="set-current-btn"
            onClick={onSetCurrent}
          >
            设为当前
          </button>
        )}
      </div>

      {/* 参数可视化 */}
      <div className="preset-visualization">
        <div className="param-bar">
          <span className="bar-label">创造性</span>
          <div className="bar-container">
            <div 
              className="bar-fill creativity"
              style={{ width: `${(preset.temperature / 2) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <div className="param-bar">
          <span className="bar-label">一致性</span>
          <div className="bar-container">
            <div 
              className="bar-fill consistency"
              style={{ width: `${(1 - preset.temperature / 2) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
} 