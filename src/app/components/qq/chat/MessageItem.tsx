'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Message, ChatItem } from '../../../types/chat';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface MessageItemProps {
  msg: Message;
  chat: ChatItem;
  index: number;
  totalMessages: number;
  dbPersonalSettings: PersonalSettings | null;
  personalSettings: PersonalSettings | undefined;
  editingMessage: { id: string; content: string } | null;
  onQuoteMessage: (msg: Message) => void;
  onEditMessage: (messageId: string, currentContent: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteMessage: (messageId: string) => void;
  onRegenerateAI: (messageId: string) => void;
  renderMessageContent: (msg: Message) => React.ReactNode;
  formatTime: (timestamp: number) => string;
  setEditingMessage: (editing: { id: string; content: string } | null) => void;
}

const MessageItem = React.memo(({
  msg,
  chat,
  index,
  totalMessages,
  dbPersonalSettings,
  personalSettings,
  editingMessage,
  onQuoteMessage,
  onEditMessage,
  onSaveEdit,
  onCancelEdit,
  onDeleteMessage,
  onRegenerateAI,
  renderMessageContent,
  formatTime,
  setEditingMessage
}: MessageItemProps) => {
  
  // 使用useMemo缓存发送者信息计算
  const senderInfo = useMemo(() => {
    if (msg.role === 'user') {
      return {
        name: dbPersonalSettings?.userNickname || personalSettings?.userNickname || chat.settings.myNickname || '我',
        avatar: dbPersonalSettings?.userAvatar || personalSettings?.userAvatar || chat.settings.myAvatar || '/avatars/user-avatar.svg'
      };
    } else {
      // AI消息，从群成员中查找对应的成员信息
      if (chat.isGroup && chat.members && msg.senderName) {
        const member = chat.members.find(m => m.originalName === msg.senderName);
        if (member) {
          return {
            name: member.groupNickname,
            avatar: member.avatar
          };
        }
      }
      return {
        name: msg.senderName || chat.name,
        avatar: msg.senderAvatar || chat.avatar
      };
    }
  }, [msg.role, msg.senderName, msg.senderAvatar, chat.isGroup, chat.members, chat.name, chat.avatar, chat.settings, dbPersonalSettings, personalSettings]);

  // 使用useMemo缓存连续消息检查
  const isConsecutiveMessage = useMemo(() => {
    if (index === 0) return false;
    
    const prevIndex = totalMessages - 51 + index - 1;
    const prevMessage = chat.messages[prevIndex];
    
    return prevMessage?.senderName === msg.senderName &&
           prevMessage?.role === msg.role &&
           Math.abs(msg.timestamp - (prevMessage?.timestamp || 0)) < 30000; // 30秒内
  }, [index, totalMessages, chat.messages, msg.senderName, msg.role, msg.timestamp]);

  return (
    <div 
      className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'} ${chat.isGroup ? 'group-message' : ''} ${isConsecutiveMessage ? 'consecutive' : ''}`}
      onDoubleClick={() => onQuoteMessage(msg)}
    >
      <div className="message-avatar">
        <Image 
          src={senderInfo.avatar}
          alt={senderInfo.name}
          width={36}
          height={36}
          className="avatar-image"
          unoptimized={senderInfo.avatar?.startsWith('data:')}
        />
      </div>
      <div className="message-content">
        {chat.isGroup && (
          <div className="message-sender">{senderInfo.name}</div>
        )}
        {msg.quote && (
          <div className="quoted-message">
            <div className="quote-header">
              <span className="quote-sender">{msg.quote.senderName}</span>
              <span className="quote-time">{formatTime(msg.quote.timestamp)}</span>
            </div>
            <div className="quote-content">{msg.quote.content}</div>
          </div>
        )}
        
        {/* 编辑状态 */}
        {editingMessage?.id === msg.id ? (
          <div className="message-edit-container">
            <textarea
              value={editingMessage.content}
              onChange={(e) => setEditingMessage({...editingMessage, content: e.target.value})}
              className="message-edit-input"
              autoFocus
            />
            <div className="message-edit-actions">
              <button onClick={onSaveEdit} className="edit-save-btn">✅ 保存</button>
              <button onClick={onCancelEdit} className="edit-cancel-btn">❌ 取消</button>
            </div>
          </div>
        ) : (
          <div className="message-bubble">
            {renderMessageContent(msg)}
          </div>
        )}
        
        <div className="message-time">
          {formatTime(msg.timestamp)}
          {/* 消息操作图标 */}
          <div className="message-actions">
            {msg.role === 'user' && (
              <button 
                className="message-action-btn edit-btn"
                onClick={() => onEditMessage(msg.id, msg.content)}
                title="编辑消息"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
            {msg.role === 'assistant' && (
              <button 
                className="message-action-btn regenerate-btn"
                onClick={() => onRegenerateAI(msg.id)}
                title="重新生成"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              </button>
            )}
            <button 
              className="message-action-btn delete-btn"
              onClick={() => onDeleteMessage(msg.id)}
              title="删除消息"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem; 