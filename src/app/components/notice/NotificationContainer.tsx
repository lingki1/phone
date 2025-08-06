'use client';

import React from 'react';
import NotificationItem from './NotificationItem';
import { NotificationItem as NotificationItemType } from './types';
import './NotificationContainer.css';

interface NotificationContainerProps {
  notification: NotificationItemType | null;
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export default function NotificationContainer({
  notification,
  onRemove,
  position = 'top-center' // 默认改为顶部居中
}: NotificationContainerProps) {
  // 如果没有通知，不渲染任何内容
  if (!notification) {
    return null;
  }

  return (
    <div className={`notification-container notification-${position}`}>
      {/* 单一通知显示 */}
      <div className="notification-list">
        <NotificationItem
          notification={notification}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
} 