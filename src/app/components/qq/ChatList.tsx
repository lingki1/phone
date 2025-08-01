'use client';

import React, { useState, useEffect } from 'react';
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
  onAssociateWorldBook?: (chatId: string) => void;
}

export default function ChatList({ chats, onChatClick, onDeleteChat, onEditChat, onAssociateWorldBook }: ChatListProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

  const handleChatClick = (chatId: string) => {
    // 如果菜单是打开的，不触发聊天点击
    if (activeMenuId) {
      return;
    }
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
    
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    // 计算菜单位置
    const x = rect.left + rect.width - 100; // 菜单宽度100px
    const y = rect.bottom + 4; // 4px间距
    
    setMenuPosition({ x, y });
    setActiveMenuId(activeMenuId === chatId ? null : chatId);
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个聊天吗？')) {
      onDeleteChat?.(chatId);
    }
    setActiveMenuId(null);
    setMenuPosition(null);
  };

  const handleEditClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    onEditChat?.(chatId);
    setActiveMenuId(null);
    setMenuPosition(null);
  };

  const handleAssociateWorldBookClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    onAssociateWorldBook?.(chatId);
    setActiveMenuId(null);
    setMenuPosition(null);
  };

  // 点击遮罩层关闭菜单
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveMenuId(null);
      setMenuPosition(null);
    }
  };

  // 监听ESC键关闭菜单
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
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
    <>
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
              <button 
                className="menu-btn"
                onClick={(e) => handleMenuClick(e, chat.id)}
              >
                ⋯
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 全局遮罩层和菜单 */}
      {activeMenuId && menuPosition && (
        <div className="menu-overlay" onClick={handleOverlayClick}>
          <div 
            className="floating-menu"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="menu-item"
              onClick={(e) => handleEditClick(e, activeMenuId)}
            >
              编辑
            </button>
            <button 
              className="menu-item"
              onClick={(e) => handleAssociateWorldBookClick(e, activeMenuId)}
            >
              关联世界书
            </button>
            <button 
              className="menu-item delete"
              onClick={(e) => handleDeleteClick(e, activeMenuId)}
            >
              删除
            </button>
          </div>
        </div>
      )}
    </>
  );
}