'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Message, ChatItem } from '../../../types/chat';
import { MessageActionButtons } from '../messageactions';

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
        
        {/* 直观可见的功能按键：紧贴消息气泡下方 */}
        <div className="message-inline-actions">
          <MessageActionButtons
            message={msg}
            isUserMessage={msg.role === 'user'}
            isAIMessage={msg.role === 'assistant'}
            onQuoteMessage={onQuoteMessage}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onRegenerateAI={onRegenerateAI}
          />
        </div>
        
        <div className="message-time">
          {formatTime(msg.timestamp)}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem; 