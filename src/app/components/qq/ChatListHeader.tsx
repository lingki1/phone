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
  onOpenApiSettings: () => void;
  onOpenPersonalSettings: () => void;
  onOpenAddFriend: () => void;
  onOpenCreateGroup: () => void;
  onBackToDesktop?: () => void;
  personalSettings?: PersonalSettings;
}

export default function ChatListHeader({ activeTab, onTabChange, onOpenApiSettings, onOpenPersonalSettings, onOpenAddFriend, onOpenCreateGroup, onBackToDesktop, personalSettings }: ChatListHeaderProps) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // 添加点击空白区域关闭菜单的功能
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // 关闭用户下拉菜单
      if (showUserDropdown && !target.closest('.user-avatar-container')) {
        setShowUserDropdown(false);
      }
      
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
  }, [showUserDropdown, showAddDropdown]);

  return (
    <div className="chat-list-header">
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
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          unoptimized={personalSettings?.userAvatar?.startsWith('data:')}
        />
        
        {/* 用户下拉菜单 */}
        {showUserDropdown && (
          <div className="user-dropdown-menu visible">
            <div className="dropdown-item" onClick={() => { setShowUserDropdown(false); onOpenApiSettings(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
              <span>API设置</span>
            </div>
            <div className="dropdown-item" onClick={() => { setShowUserDropdown(false); onOpenPersonalSettings(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
              </svg>
              <span>个人设置</span>
            </div>
          </div>
        )}
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="17" y1="11" x2="23" y2="11"></line>
                </svg>
                <span>添加好友</span>
              </div>
              <div className="dropdown-item" onClick={() => { setShowAddDropdown(false); onOpenCreateGroup(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <path d="M23 11l-2-2v4l2-2z"></path>
                </svg>
                <span>创建群聊</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 