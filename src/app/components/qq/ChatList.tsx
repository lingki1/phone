'use client';

import React, { useState, useEffect } from 'react';
import { useI18n } from '../../components/i18n/I18nProvider';
import Image from 'next/image';

interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isGroup: boolean;
  unreadCount: number;
  lastReadTimestamp: number;
}

interface ChatListProps {
  chats: ChatItem[];
  onChatClick: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onEditChat?: (chatId: string) => void;
  onAssociateWorldBook?: (chatId: string) => void;
  onResetChat?: (chatId: string) => void;
  // 可选：搜索高亮摘要
  searchQuery?: string;
  searchHitMap?: Record<string, { messageId: string; content: string } | null>;
}

export default function ChatList({ chats, onChatClick, onDeleteChat, onEditChat, onAssociateWorldBook, onResetChat, searchQuery, searchHitMap }: ChatListProps) {
  const { t, locale } = useI18n();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  
  function formatTimestamp(ts: string, currentLocale: string) {
    // 如果传入的是固定格式字符串，这里可做进一步解析
    try {
      // 优先尝试能否转换为 Date
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    // 回退：直接返回原值
    return ts;
  }

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
    
    // 计算菜单位置（根据可视区域自动上/下弹）
    const menuWidth = 140; // 与 .floating-menu 宽度保持一致的估算
    const menuHeight = 192; // 约4个菜单项 * 48px 行高
    const gap = 6; // 与按钮的间距
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // 默认向下弹
    let x = rect.left + rect.width - menuWidth;
    let y = rect.bottom + gap;

    // 如果向下空间不足，则向上弹
    if (y + menuHeight > viewportH - 8) {
      y = Math.max(8, rect.top - menuHeight - gap);
    }

    // 水平方向防溢出
    if (x + menuWidth > viewportW - 8) x = viewportW - menuWidth - 8;
    if (x < 8) x = 8;
    
    setMenuPosition({ x, y });
    setActiveMenuId(activeMenuId === chatId ? null : chatId);
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (confirm(t('QQ.ChatList.confirm.delete', '确定要删除这个聊天吗？'))) {
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

  const handleResetChatClick = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (confirm(t('QQ.ChatList.confirm.reset', '确定要清空这个角色的所有聊天记录吗？此操作不可撤销！'))) {
      onResetChat?.(chatId);
    }
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
        <p>{t('QQ.ChatList.empty', '点击右上角 "+" 或群组图标添加聊天')}</p>
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
                {chat.isGroup && <span className="group-tag">{t('QQ.ChatList.groupTag', '群聊')}</span>}
              </div>
              <div className="last-msg">{chat.lastMessage}</div>
              {searchQuery?.trim() && searchHitMap?.[chat.id]?.content && (
                <div className="search-snippet">
                  {renderHighlightedSnippet(searchHitMap![chat.id]!.content, searchQuery!)}
                </div>
              )}
            </div>
            
            <div className="meta">
              <div className="timestamp">{formatTimestamp(chat.timestamp, locale)}</div>
              {chat.unreadCount > 0 && (
                <div className="unread-badge">
                  <span className="unread-count">
                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                  </span>
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
              {t('QQ.ChatList.menu.edit', '编辑')}
            </button>
            <button 
              className="menu-item"
              onClick={(e) => handleAssociateWorldBookClick(e, activeMenuId)}
            >
              {t('QQ.ChatList.menu.associateWorldBook', '关联世界书')}
            </button>
            <button 
              className="menu-item"
              onClick={(e) => handleResetChatClick(e, activeMenuId)}
            >
              {t('QQ.ChatList.menu.resetChat', '重置聊天')}
            </button>
            <button 
              className="menu-item delete"
              onClick={(e) => handleDeleteClick(e, activeMenuId)}
            >
              {t('QQ.ChatList.menu.delete', '删除')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function renderHighlightedSnippet(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) return text;
  const start = Math.max(0, idx - 16);
  const end = Math.min(text.length, idx + q.length + 16);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  const before = text.slice(start, idx);
  const hit = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length, end);
  return (
    <span>
      {prefix}{before}
      <mark>{hit}</mark>
      {after}{suffix}
    </span>
  );
}