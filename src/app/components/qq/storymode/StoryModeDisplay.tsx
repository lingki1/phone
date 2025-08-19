'use client';

import React, { useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Message, ChatItem } from '../../../types/chat';
import './StoryModeDisplay.css';

interface StoryModeDisplayProps {
  messages: Message[];
  chat: ChatItem;
  dbPersonalSettings?: {
    userAvatar: string;
    userNickname: string;
    userBio: string;
  } | null;
  personalSettings?: {
    userAvatar: string;
    userNickname: string;
    userBio: string;
  };
  onQuoteMessage: (msg: Message) => void;
  onEditMessage: (messageId: string, currentContent: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteMessage: (messageId: string) => void;
  onRegenerateAI: (messageId: string) => void;
  editingMessage: { id: string, content: string } | null;
  setEditingMessage: (editing: { id: string, content: string } | null) => void;
}

export default function StoryModeDisplay({
  messages,
  chat,
  dbPersonalSettings,
  personalSettings,
  onQuoteMessage,
  onEditMessage,
  onSaveEdit,
  onCancelEdit,
  onDeleteMessage,
  onRegenerateAI,
  editingMessage,
  setEditingMessage
}: StoryModeDisplayProps) {
  const storyContainerRef = useRef<HTMLDivElement>(null);

  // 滚动到底部函数
  const scrollToBottom = useCallback((smooth = true) => {
    if (storyContainerRef.current) {
      storyContainerRef.current.scrollTo({
        top: storyContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  }, []);

  // 当消息更新时自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages.length, scrollToBottom]);

  // 组件挂载时直接设置滚动位置到最新消息（不使用滚动动画）
  useEffect(() => {
    if (messages.length > 0) {
      // 使用requestAnimationFrame确保DOM渲染完成后再设置滚动位置
      requestAnimationFrame(() => {
        if (storyContainerRef.current) {
          storyContainerRef.current.scrollTop = storyContainerRef.current.scrollHeight;
        }
      });
    }
  }, []); // 只在组件挂载时触发一次
  
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);

  const renderStoryContent = useCallback((content: string) => {
    // 处理换行符，将\n转换为<br>标签
    const contentWithBreaks = content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
    return <span>{contentWithBreaks}</span>;
  }, []);

  const renderMessage = useCallback((msg: Message) => {
    const isUser = msg.role === 'user';
    const isEditing = editingMessage?.id === msg.id;
    
    return (
      <div 
        key={msg.id} 
        className={`story-message ${isUser ? 'story-user-message' : 'story-ai-message'}`}
      >
        <div className="story-message-header">
          <div className="story-message-avatar">
            <Image 
              src={isUser ? (dbPersonalSettings?.userAvatar || personalSettings?.userAvatar || '/avatars/user-avatar.svg') : (msg.senderAvatarId && chat.avatarMap?.[msg.senderAvatarId] ? chat.avatarMap[msg.senderAvatarId] : chat.avatar)}
              alt={isUser ? '我' : (msg.senderName || chat.name)}
              width={32}
              height={32}
              className="story-avatar-image"
              unoptimized={(isUser ? (dbPersonalSettings?.userAvatar || personalSettings?.userAvatar) : (msg.senderAvatarId && chat.avatarMap?.[msg.senderAvatarId] ? chat.avatarMap[msg.senderAvatarId] : chat.avatar))?.startsWith('data:')}
            />
          </div>
          <div className="story-message-info">
            <div className="story-message-sender">
              {isUser ? '我' : (msg.senderName || chat.name)}
            </div>
            <div className="story-message-time">
              {formatTime(msg.timestamp)}
            </div>
          </div>
          <div className="story-message-actions">
            <button 
              className="story-action-btn"
              onClick={() => onQuoteMessage(msg)}
              title="引用"
            >
              💬
            </button>
            {isUser && (
              <>
                <button 
                  className="story-action-btn"
                  onClick={() => onEditMessage(msg.id, msg.content)}
                  title="编辑"
                >
                  ✏️
                </button>
                <button 
                  className="story-action-btn"
                  onClick={() => onDeleteMessage(msg.id)}
                  title="删除"
                >
                  🗑️
                </button>
              </>
            )}
            {!isUser && (
              <button 
                className="story-action-btn"
                onClick={() => onRegenerateAI(msg.id)}
                title="重新生成"
              >
                🔄
              </button>
            )}
          </div>
        </div>
        
        <div className="story-message-content">
          {isEditing ? (
            <div className="story-edit-container">
              <textarea
                value={editingMessage.content}
                onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                className="story-edit-textarea"
                autoFocus
              />
              <div className="story-edit-actions">
                <button 
                  className="story-save-btn"
                  onClick={onSaveEdit}
                >
                  保存
                </button>
                <button 
                  className="story-cancel-btn"
                  onClick={onCancelEdit}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="story-content-text">
              {renderStoryContent(msg.content)}
            </div>
          )}
        </div>
      </div>
    );
  }, [chat, dbPersonalSettings, personalSettings, editingMessage, formatTime, renderStoryContent, onQuoteMessage, onEditMessage, onSaveEdit, onCancelEdit, onDeleteMessage, onRegenerateAI, setEditingMessage]);

  return (
    <div className="story-display-container" ref={storyContainerRef}>
      {messages.length === 0 ? (
        <div className="story-empty-state">
          <div className="story-empty-icon">📖</div>
          <div className="story-empty-text">
            开始编写你的剧情故事吧！
          </div>
          <div className="story-empty-hint">
            点击下方输入框开始创作
          </div>
        </div>
      ) : (
        <div className="story-messages-list">
          {messages.map((msg) => renderMessage(msg))}
        </div>
      )}
    </div>
  );
}
