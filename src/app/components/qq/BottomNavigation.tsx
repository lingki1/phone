'use client';

import React, { useEffect, useState } from 'react';
import './BottomNavigation.css';

// 导航项类型定义
export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

// 底部导航组件属性
interface BottomNavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  navItems?: NavItem[];
  className?: string;
  newContentCount?: {
    moments?: number;
    messages?: number;
  };
  // 新增：强制显示选项
  forceShow?: boolean;
}

// 默认导航项配置
const defaultNavItems: NavItem[] = [
  {
    key: 'messages',
    label: '消息',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    )
  },
  {
    key: 'moments',
    label: '动态',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  {
    key: 'recollection',
    label: '回忆',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M8 7h8M8 11h8M8 15h4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    )
  },
  {
    key: 'me',
    label: '我',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    )
  }
];

export default function BottomNavigation({ 
  activeView, 
  onViewChange, 
  navItems = defaultNavItems,
  className = '',
  newContentCount = {},
  forceShow = false
}: BottomNavigationProps) {
  const [shouldShow, setShouldShow] = useState(false);

  // 检测当前页面是否应该显示底部导航
  useEffect(() => {
    const checkCurrentPage = () => {
      // 如果强制显示，直接返回true
      if (forceShow) {
        setShouldShow(true);
        return;
      }

      // 获取当前页面的组件名称
      const getCurrentPageName = (): string => {
        // 检查是否存在特定的CSS类来判断当前页面
        const chatListElement = document.querySelector('.chat-list-page');
        const mePageElement = document.querySelector('.me-page');
        const mePageContainerElement = document.querySelector('.me-page-container');
        const discoverPageElement = document.querySelector('.discover-page');
        const recollectionPageElement = document.querySelector('.recollection-page');
        
        if (chatListElement) return 'ChatListPage';
        if (mePageElement || mePageContainerElement) return 'MePage';
        if (discoverPageElement) return 'DiscoverPage';
        if (recollectionPageElement) return 'RecollectionPage';
        
        // 通过页面内容特征判断
        const hasChatList = document.querySelector('.chat-list');
        const hasMeContent = document.querySelector('.me-profile-section');
        const hasDiscoverContent = document.querySelector('.discover-content');
        const hasRecollectionContent = document.querySelector('.recollection-content');
        
        if (hasChatList) return 'ChatListPage';
        if (hasMeContent) return 'MePage';
        if (hasDiscoverContent) return 'DiscoverPage';
        if (hasRecollectionContent) return 'RecollectionPage';
        
        return '';
      };

      const currentPageName = getCurrentPageName();
      const isAllowedPage = ['ChatListPage', 'MePage', 'DiscoverPage', 'RecollectionPage'].includes(currentPageName);
      
      setShouldShow(isAllowedPage);
      
      console.log('BottomNavigation - 页面检测:', {
        currentPageName,
        isAllowedPage,
        shouldShow: isAllowedPage,
        forceShow
      });
    };

    // 初始检查
    checkCurrentPage();

    // 监听页面变化
    const observer = new MutationObserver(checkCurrentPage);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 监听自定义页面切换事件
    const handlePageChange = () => {
      setTimeout(checkCurrentPage, 100);
    };
    
    window.addEventListener('pageChanged', handlePageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('pageChanged', handlePageChange);
    };
  }, [forceShow]);

  const createRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.className = 'ripple';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleItemClick = (itemKey: string, event: React.MouseEvent<HTMLDivElement>) => {
    createRipple(event);
    onViewChange(itemKey);
  };

  // 如果不应该显示，返回null
  if (!shouldShow) {
    return null;
  }

  return (
    <div className={`bottom-navigation ${className}`}>
      {navItems.map((item) => {
        const count = newContentCount[item.key as keyof typeof newContentCount] || 0;
        
        return (
          <div
            key={item.key}
            className={`nav-item ${activeView === item.key ? 'active' : ''}`}
            onClick={(e) => handleItemClick(item.key, e)}
          >
            <div className="nav-icon">
              {item.icon}
              {/* 新内容提示 */}
              {count > 0 && (
                <div className="nav-badge">
                  <span className="badge-count">
                    {count > 99 ? '99+' : count}
                  </span>
                </div>
              )}
            </div>
            <span className="nav-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// 导出类型和默认配置，方便其他组件使用
export { defaultNavItems };
export type { BottomNavigationProps }; 