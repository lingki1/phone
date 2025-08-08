'use client';

import React from 'react';
import { Message } from '../../../types/chat';
import './MessageActionButtons.css';

export interface MessageActionButtonsProps {
  message: Message;
  isUserMessage: boolean;
  isAIMessage: boolean;
  onQuoteMessage: (message: Message) => void;
  onEditMessage: (messageId: string, currentContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onRegenerateAI?: (messageId: string) => void;
}

export default function MessageActionButtons({
  message,
  isUserMessage,
  isAIMessage,
  onQuoteMessage,
  onEditMessage,
  onDeleteMessage,
  onRegenerateAI
}: MessageActionButtonsProps) {
  const handleQuote = () => onQuoteMessage(message);
  const handleEdit = () => onEditMessage(message.id, message.content);
  const handleDelete = () => {
    if (confirm('确定要删除这条消息吗？')) onDeleteMessage(message.id);
  };
  const handleRegenerate = () => onRegenerateAI?.(message.id);

  return (
    <div className="inline-action-bar" role="toolbar" aria-label="消息操作工具栏">
      <button className="inline-action-btn" onClick={handleQuote} title="引用" aria-label="引用">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
        </svg>
      </button>

      {isUserMessage && (
        <button className="inline-action-btn" onClick={handleEdit} title="编辑" aria-label="编辑">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
        </button>
      )}

      {isAIMessage && onRegenerateAI && (
        <button className="inline-action-btn" onClick={handleRegenerate} title="重新生成" aria-label="重新生成">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          </svg>
        </button>
      )}

      <button className="inline-action-btn danger" onClick={handleDelete} title="删除" aria-label="删除">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    </div>
  );
}
