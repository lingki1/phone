'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
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
  _totalMessages: number;
  dbPersonalSettings: PersonalSettings | null;
  personalSettings: PersonalSettings | undefined;
  editingMessage: { id: string; content: string } | null;
  onQuoteMessage: (message: Message) => void;
  onEditMessage: (messageId: string, currentContent: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteMessage: (messageId: string) => void;
  onRegenerateAI?: (messageId: string) => void;
  renderMessageContent: (msg: Message) => React.ReactNode;
  formatTime: (timestamp: number) => string;
  setEditingMessage: (editingMessage: { id: string; content: string } | null) => void;
}

const MessageItem = memo(({
  msg,
  chat,
  index,
  _totalMessages,
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
  const [showActions, setShowActions] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // 长按检测逻辑
  const handleMouseDown = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    longPressTimerRef.current = setTimeout(() => {
      setShowActions(true);
    }, 500); // 500ms长按触发
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 触摸设备支持
  const handleTouchStart = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    longPressTimerRef.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 点击外部关闭操作按钮
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActions && messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // 获取发送者信息
  const senderInfo = React.useMemo(() => {
    if (msg.role === 'user') {
      // 用户消息头像获取逻辑
      let avatar = '/avatars/user-avatar.svg'; // 默认头像
      
      // 优先从头像映射表获取
      if (msg.senderAvatarId && chat.avatarMap?.[msg.senderAvatarId]) {
        avatar = chat.avatarMap[msg.senderAvatarId];
      } else {
        // 回退到传统方式
        avatar = dbPersonalSettings?.userAvatar || personalSettings?.userAvatar || chat.settings.myAvatar || avatar;
      }
      
      return {
        name: dbPersonalSettings?.userNickname || personalSettings?.userNickname || chat.settings.myNickname || '我',
        avatar: avatar
      };
    } else {
      // AI消息头像获取逻辑
      let avatar = chat.avatar; // 默认使用聊天头像
      let name = msg.senderName || chat.name;
      
      // 优先从头像映射表获取
      if (msg.senderAvatarId && chat.avatarMap?.[msg.senderAvatarId]) {
        avatar = chat.avatarMap[msg.senderAvatarId];
      } else {
        // 回退到传统方式 - 从群成员中查找或使用最新的AI头像
        if (chat.isGroup && chat.members && msg.senderName) {
          const member = chat.members.find(m => m.originalName === msg.senderName);
          if (member) {
            avatar = member.avatar;
            name = member.groupNickname;
          }
        } else {
          // 单聊情况：使用最新的AI头像，确保头像更新后能立即显示
          avatar = chat.settings.aiAvatar || chat.avatar;
        }
      }
      
      return {
        name: name,
        avatar: avatar
      };
    }
  }, [msg.role, msg.senderName, msg.senderAvatarId, chat.isGroup, chat.members, chat.name, chat.avatar, chat.avatarMap, chat.settings, dbPersonalSettings, personalSettings]);

  // 检查是否为连续消息
  const isConsecutiveMessage = React.useMemo(() => {
    if (index === 0) return false;
    
    const prevIndex = _totalMessages - 51 + index - 1;
    const prevMessage = chat.messages[prevIndex];
    
    return prevMessage?.senderName === msg.senderName &&
           prevMessage?.role === msg.role &&
           Math.abs(msg.timestamp - (prevMessage?.timestamp || 0)) < 30000; // 30秒内
  }, [index, _totalMessages, chat.messages, msg.senderName, msg.role, msg.timestamp]);

  return (
    <div 
      ref={messageRef}
      className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'} ${chat.isGroup ? 'group-message' : ''} ${isConsecutiveMessage ? 'consecutive' : ''}`}
      onDoubleClick={() => onQuoteMessage(msg)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="message-avatar">
        <Image 
          src={senderInfo.avatar}
          alt={senderInfo.name}
          width={42}
          height={42}
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
        
        {/* 消息底部信息：时间 + 功能按键（AI消息）或 时间 + 功能按键（用户消息） */}
        <div className="message-footer">
          {msg.role === 'assistant' ? (
            // AI消息：时间 + 功能按键
            <>
              <div className="message-time">
                {formatTime(msg.timestamp)}
              </div>
              <div className="message-inline-actions">
                <MessageActionButtons
                  message={msg}
                  isUserMessage={false}
                  isAIMessage={true}
                  onQuoteMessage={onQuoteMessage}
                  onEditMessage={onEditMessage}
                  onDeleteMessage={onDeleteMessage}
                  onRegenerateAI={onRegenerateAI}
                  isVisible={showActions}
                />
              </div>
            </>
          ) : (
            // 用户消息：时间 + 功能按键（从右到左）
            <>
              <div className="message-time">
                {formatTime(msg.timestamp)}
              </div>
              <div className="message-inline-actions">
                <MessageActionButtons
                  message={msg}
                  isUserMessage={true}
                  isAIMessage={false}
                  onQuoteMessage={onQuoteMessage}
                  onEditMessage={onEditMessage}
                  onDeleteMessage={onDeleteMessage}
                  onRegenerateAI={onRegenerateAI}
                  isVisible={showActions}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem; 