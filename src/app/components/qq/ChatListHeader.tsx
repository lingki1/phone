'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface PersonalSettings {
  userAvatar: string;
  userNickname: string;
  userBio: string;
}

interface ChatListHeaderProps {
  activeTab: 'all' | 'single' | 'group';
  onTabChange: (tab: 'all' | 'single' | 'group') => void;
  onOpenAddFriend: () => void;
  onOpenCreateGroup: () => void;
  onOpenWorldBook: () => void;
  onOpenCharacterImport?: () => void;
  onBackToDesktop?: () => void;
  onOpenMePage?: () => void;
  personalSettings?: PersonalSettings;
}

export default function ChatListHeader({ activeTab, onTabChange, onOpenAddFriend, onOpenCreateGroup, onOpenWorldBook, onOpenCharacterImport, onBackToDesktop, onOpenMePage, personalSettings }: ChatListHeaderProps) {
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // 添加点击空白区域关闭菜单的功能
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // 关闭添加下拉菜单
      if (showAddDropdown && !target.closest('.add-menu-container')) {
        setShowAddDropdown(false);
      }
    };

    // 添加事件监听器
    document.addEventListener('mousedown', handleClickOutside);
    
    // 清理事件监听器
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddDropdown]);

  return (
    <div className="chat-list-header">
      {/* 左侧区域：返回按钮 + 用户头像 + 用户名 */}
      <div className="header-left">
        {/* 返回按钮 */}
        {onBackToDesktop && (
          <div className="back-button" onClick={onBackToDesktop}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* 用户头像 */}
        <div className="user-avatar-container">
          <Image 
            src={personalSettings?.userAvatar || '/avatars/user-avatar.svg'} 
            alt="用户头像" 
            width={48}
            height={48}
            className="user-avatar"
            onClick={onOpenMePage}
            unoptimized={personalSettings?.userAvatar?.startsWith('data:')}
          />
        </div>

        {/* 用户名 */}
        <div className="user-name" onClick={onOpenMePage}>
          {personalSettings?.userNickname || '用户'}
        </div>
      </div>

      {/* 群聊/单聊切换开关 */}
      <div className="chat-type-toggle">
        <button 
          className={`toggle-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => onTabChange('all')}
        >
          全部
        </button>
        <button 
          className={`toggle-btn ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => onTabChange('single')}
        >
          单聊
        </button>
        <button 
          className={`toggle-btn ${activeTab === 'group' ? 'active' : ''}`}
          onClick={() => onTabChange('group')}
        >
          群聊
        </button>
      </div>

      {/* 右侧操作区域 */}
      <div className="header-actions">
        <div className="add-menu-container">
          <span 
            className="action-btn"
            onClick={() => setShowAddDropdown(!showAddDropdown)}
          >
            +
          </span>
          
          {/* 添加菜单下拉 */}
          {showAddDropdown && (
            <div className="add-dropdown-menu visible">
              <div className="dropdown-item" onClick={() => { setShowAddDropdown(false); onOpenAddFriend(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2"/>
                  <line x1="17" y1="11" x2="23" y2="11" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>添加好友</span>
              </div>
              <div className="dropdown-item" onClick={() => { setShowAddDropdown(false); onOpenCreateGroup(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 11l-2-2v4l2-2z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>创建群聊</span>
              </div>
              <div className="dropdown-item" onClick={() => { setShowAddDropdown(false); onOpenWorldBook(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>世界书</span>
              </div>
              {onOpenCharacterImport && (
                <div className="dropdown-item" onClick={() => { setShowAddDropdown(false); onOpenCharacterImport(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>导入角色卡片</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 