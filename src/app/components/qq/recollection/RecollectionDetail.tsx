'use client';

import React, { useState, useCallback } from 'react';
import { WorldBook } from '../../../types/chat';
import MarkdownRenderer from './MarkdownRenderer';
import './RecollectionDetail.css';

interface RecollectionDetailProps {
  recollection: WorldBook;
  onBack: () => void;
}

export default function RecollectionDetail({ recollection, onBack }: RecollectionDetailProps) {
  const [isFullscreen] = useState(true);

  // 格式化日期
  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // 保留备用方法，当前未使用，以下划线前缀避免告警
  const _extractChatName = useCallback((title: string) => {
    const match = title.match(/^(.+?) - /);
    return match ? match[1] : '未知';
  }, []);


  // 复制内容
  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(recollection.content || '');
    alert('内容已复制到剪贴板');
  }, [recollection.content]);

  return (
    <div className={`recollection-detail ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* 头部导航 */}
      <div className="recollection-detail-header">
        <button 
          className="recollection-back-btn"
          onClick={onBack}
          title="返回列表"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </button>
        
        <div className="recollection-detail-info">
          <h1 className="recollection-detail-title">
            {recollection.name || '回忆详情'}
          </h1>
          <div className="recollection-detail-meta">
            <span className="recollection-chat-name">
              {recollection.name || '未知'}
            </span>
            <span className="recollection-separator">•</span>
            <span className="recollection-date">
              {formatDate(recollection.createdAt || Date.now())}
            </span>
            {(recollection as WorldBook & { metadata?: { messageCount?: number } }).metadata?.messageCount && (
              <>
                <span className="recollection-separator">•</span>
                <span className="recollection-message-count">
                  {(recollection as WorldBook & { metadata?: { messageCount?: number } }).metadata?.messageCount} 条消息
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="recollection-detail-actions">
          <button 
            className="recollection-action-btn"
            onClick={copyContent}
            title="复制内容"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="recollection-detail-content">
        <div className="recollection-content-wrapper">
          <MarkdownRenderer content={recollection.content || ''} />
        </div>
      </div>

      {/* 标签区域 */}
      {(recollection as WorldBook & { tags?: string[] }).tags && (recollection as WorldBook & { tags?: string[] }).tags!.length > 0 && (
        <div className="recollection-detail-tags">
          <h4>标签</h4>
          <div className="recollection-tags-list">
            {(recollection as WorldBook & { tags?: string[] }).tags!.map((tag, index) => (
              <span key={index} className="recollection-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
