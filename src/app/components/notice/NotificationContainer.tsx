'use client';

import React from 'react';
import NotificationItem from './NotificationItem';
import { NotificationItem as NotificationItemType } from './types';
import './NotificationContainer.css';

interface NotificationContainerProps {
  notifications: NotificationItemType[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  maxNotifications?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export default function NotificationContainer({
  notifications,
  onRemove,
  onClearAll,
  maxNotifications = 5,
  position = 'top-right'
}: NotificationContainerProps) {
  // 限制显示的通知数量
  const displayNotifications = notifications.slice(0, maxNotifications);

  if (displayNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-container notification-${position}`}>
      {/* 清空所有按钮 */}
      {notifications.length > 1 && (
        <div className="notification-header">
          <button 
            className="clear-all-btn"
            onClick={onClearAll}
            title="清空所有通知"
          >
            清空全部
          </button>
        </div>
      )}
      
      {/* 通知列表 */}
      <div className="notification-list">
        {displayNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
          />
        ))}
      </div>
      
      {/* 更多通知提示 */}
      {notifications.length > maxNotifications && (
        <div className="notification-more">
          <span>还有 {notifications.length - maxNotifications} 条通知</span>
        </div>
      )}
    </div>
  );
} 