'use client';

import React from 'react';
import { Message } from '../../../types/chat';
import { useI18n } from '../../i18n/I18nProvider';
import './MessageActionButtons.css';

export interface MessageActionButtonsProps {
  message: Message;
  isUserMessage: boolean;
  isAIMessage: boolean;
  onQuoteMessage: (message: Message) => void;
  onEditMessage: (messageId: string, currentContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onRegenerateAI?: (messageId: string) => void;
  onStartBatchDelete?: () => void;
  isVisible?: boolean;
}

export default function MessageActionButtons({
  message,
  isUserMessage,
  isAIMessage,
  onQuoteMessage,
  onEditMessage,
  onDeleteMessage,
  onRegenerateAI,
  onStartBatchDelete,
  isVisible = false
}: MessageActionButtonsProps) {
  const { t } = useI18n();
  const handleQuote = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发消息点击
    onQuoteMessage(message);
  };
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发消息点击
    onEditMessage(message.id, message.content);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发消息点击
    if (confirm(t('QQ.ChatInterface.MessageActions.MessageActionButtons.confirm.delete', '确定要删除这条消息吗？'))) onDeleteMessage(message.id);
  };
  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发消息点击
    onRegenerateAI?.(message.id);
  };
  const handleStartBatchDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发消息点击
    onStartBatchDelete?.();
  };

  return (
    <div 
      className={`inline-action-bar ${isVisible ? 'visible' : 'hidden'}`}
      role="toolbar" 
      aria-label={t('QQ.ChatInterface.MessageActions.MessageActionButtons.aria.toolbar', '消息操作工具栏')}
      style={{ 
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease'
      }}
      onClick={(e) => e.stopPropagation()} // 防止点击功能按键区域时触发消息点击
    >
      <button className="inline-action-btn" onClick={handleQuote} title={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.quote', '引用')} aria-label={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.quote', '引用')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
        </svg>
      </button>

      {isUserMessage && (
        <button className="inline-action-btn" onClick={handleEdit} title={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.edit', '编辑')} aria-label={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.edit', '编辑')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
      )}

      {isAIMessage && onRegenerateAI && (
        <button className="inline-action-btn" onClick={handleRegenerate} title={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.regenerate', '重新生成')} aria-label={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.regenerate', '重新生成')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
        </button>
      )}

      <button className="inline-action-btn danger" onClick={handleDelete} title={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.delete', '删除')} aria-label={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.delete', '删除')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>

      {onStartBatchDelete && (
        <button className="inline-action-btn batch" onClick={handleStartBatchDelete} title={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.batchDelete', '多选删除')} aria-label={t('QQ.ChatInterface.MessageActions.MessageActionButtons.actions.batchDelete', '多选删除')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {/* 多选图标：多个复选框 */}
            <rect x="3" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <rect x="9" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <rect x="15" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <rect x="3" y="9" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <rect x="9" y="9" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <rect x="15" y="9" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <rect x="3" y="15" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <rect x="9" y="15" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <rect x="15" y="15" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </button>
      )}
    </div>
  );
}
