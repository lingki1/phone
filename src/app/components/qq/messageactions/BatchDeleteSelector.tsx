'use client';

import React, { useState, useEffect } from 'react';
import { Message } from '../../../types/chat';
import { useI18n } from '../../i18n/I18nProvider';
import './BatchDeleteSelector.css';

export interface BatchDeleteSelectorProps {
  messages: Message[];
  onBatchDelete: (messageIds: string[]) => void;
  onCancel: () => void;
  isVisible: boolean;
}

export default function BatchDeleteSelector({
  messages,
  onBatchDelete,
  onCancel,
  isVisible
}: BatchDeleteSelectorProps) {
  const { t, locale } = useI18n();
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // 当组件显示时重置选择状态
  useEffect(() => {
    if (isVisible) {
      setSelectedMessages(new Set());
      setSelectAll(false);
    }
  }, [isVisible]);

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMessages(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(messages.map(msg => msg.id));
      setSelectedMessages(allIds);
      setSelectAll(true);
    }
  };

  // 处理单个消息选择
  const handleMessageSelect = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
    setSelectAll(newSelected.size === messages.length);
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedMessages.size === 0) {
      alert(t('QQ.ChatInterface.MessageActions.BatchDeleteSelector.errors.noSelection', '请先选择要删除的消息'));
      return;
    }

    const count = selectedMessages.size;
    const confirmMessage = t('QQ.ChatInterface.MessageActions.BatchDeleteSelector.confirm.delete', '确定要删除选中的 {{count}} 条消息吗？此操作不可撤销！').replace('{{count}}', String(count));
    
    if (confirm(confirmMessage)) {
      onBatchDelete(Array.from(selectedMessages));
    }
  };

  // 格式化消息预览
  const formatMessagePreview = (content: string) => {
    const maxLength = 50;
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(locale || 'zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isVisible) return null;

  return (
    <div className="batch-delete-selector">
      <div className="batch-delete-header">
        <div className="batch-delete-title">
          <span className="batch-delete-icon">🗑️</span>
          <span>{t('QQ.ChatInterface.MessageActions.BatchDeleteSelector.title', '批量删除消息')}</span>
        </div>
        <button className="batch-delete-close" onClick={onCancel}>
          ✕
        </button>
      </div>

      <div className="batch-delete-controls">
        <label className="select-all-checkbox">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
          />
          <span>{t('QQ.ChatInterface.MessageActions.BatchDeleteSelector.selectAll', '全选 ({{selected}}/{{total}})').replace('{{selected}}', String(selectedMessages.size)).replace('{{total}}', String(messages.length))}</span>
        </label>
        
        <div className="batch-delete-actions">
          <button 
            className="batch-delete-btn cancel"
            onClick={onCancel}
          >
            {t('QQ.ChatInterface.MessageActions.BatchDeleteSelector.buttons.cancel', '取消')}
          </button>
          <button 
            className="batch-delete-btn confirm"
            onClick={handleBatchDelete}
            disabled={selectedMessages.size === 0}
          >
            {t('QQ.ChatInterface.MessageActions.BatchDeleteSelector.buttons.deleteSelected', '删除选中 ({{count}})').replace('{{count}}', String(selectedMessages.size))}
          </button>
        </div>
      </div>

      <div className="batch-delete-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`batch-delete-message ${selectedMessages.has(message.id) ? 'selected' : ''}`}
            onClick={() => handleMessageSelect(message.id)}
          >
            <div className="batch-delete-message-checkbox">
              <input
                type="checkbox"
                checked={selectedMessages.has(message.id)}
                onChange={() => handleMessageSelect(message.id)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="batch-delete-message-content">
              <div className="batch-delete-message-header">
                <span className="batch-delete-message-sender">
                  {message.role === 'user' ? t('QQ.ChatInterface.MessageActions.BatchDeleteSelector.sender.me', '我') : (message.senderName || t('QQ.ChatInterface.MessageActions.BatchDeleteSelector.sender.ai', 'AI'))}
                </span>
                <span className="batch-delete-message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
              <div className="batch-delete-message-text">
                {formatMessagePreview(message.content)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
