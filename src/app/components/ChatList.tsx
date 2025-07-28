'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isGroup: boolean;
  unreadCount?: number;
}

interface ChatListProps {
  chats: ChatItem[];
  onChatClick: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onEditChat?: (chatId: string) => void;
}

export default function ChatList({ chats, onChatClick, onDeleteChat, onEditChat }: ChatListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const handleChatClick = (chatId: string) => {
    onChatClick(chatId);
  };

  const handleAvatarClick = (e: React.MouseEvent, chatId: string, chatName: string) => {
    e.stopPropagation();
    // 这里可以添加"拍一拍"功能
    console.log('拍一拍:', chatName);
  };

  const handleMenuClick = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setActiveMenuId(activeMenuId === chatId ? null : chatId);
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个聊天吗？')) {
      onDeleteChat?.(chatId);
    }
    setActiveMenuId(null);
  };

  const handleEditClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    onEditChat?.(chatId);
    setActiveMenuId(null);
  };

  // 点击其他地方关闭菜单
  const handleDocumentClick = (e: Event) => {
    // 检查点击的元素是否在菜单容器内
    const target = e.target as Element;
    if (target.closest('.menu-container')) {
      return;
    }
    setActiveMenuId(null);
  };

  // 监听文档点击事件
  React.useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  if (chats.length === 0) {
    return (
      <div className="chat-list-empty">
        <p>点击右上角 &quot;+&quot; 或群组图标添加聊天</p>
      </div>
    );
  }

  return (
    <div className="chat-list">
      {chats.map((chat) => (
        <div 
          key={chat.id} 
          className="chat-list-item"
          onClick={() => handleChatClick(chat.id)}
        >
          <Image 
            src={chat.avatar} 
            alt={chat.name}
            width={45}
            height={45}
            className="avatar"
            onClick={(e) => handleAvatarClick(e, chat.id, chat.name)}
          />
          
          <div className="info">
            <div className="name-line">
              <span className="name">{chat.name}</span>
              {chat.isGroup && <span className="group-tag">群聊</span>}
            </div>
            <div className="last-msg">{chat.lastMessage}</div>
          </div>
          
          <div className="meta">
            <div className="timestamp">{chat.timestamp}</div>
            {chat.unreadCount && chat.unreadCount > 0 && (
              <div className="unread-count">
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </div>
            )}
            <div className="menu-container">
              <button 
                className="menu-btn"
                onClick={(e) => handleMenuClick(e, chat.id)}
              >
                ⋯
              </button>
              {activeMenuId === chat.id && (
                <div className="dropdown-menu">
                  <button 
                    className="menu-item"
                    onClick={(e) => handleEditClick(e, chat.id)}
                  >
                    编辑
                  </button>
                  <button 
                    className="menu-item delete"
                    onClick={(e) => handleDeleteClick(e, chat.id)}
                  >
                    删除
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}