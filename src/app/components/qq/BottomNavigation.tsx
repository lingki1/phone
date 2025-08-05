'use client';

import React from 'react';
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
  newContentCount = {}
}: BottomNavigationProps) {
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