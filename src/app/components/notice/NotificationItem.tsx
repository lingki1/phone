'use client';

import React, { useState, useEffect } from 'react';
import { NotificationItem as NotificationItemType } from './types';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: NotificationItemType;
  onRemove: (id: string) => void;
}

export default function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // 动画效果
  useEffect(() => {
    // 显示动画
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(showTimer);
  }, []);

  // 处理移除
  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300); // 等待动画完成
  };

  // 处理动作点击
  const handleActionClick = () => {
    if (notification.action) {
      notification.action.onClick();
      handleRemove(); // 点击动作后移除通知
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  return (
    <div 
      className={`notification-item notification-${notification.type} ${
        isVisible ? 'notification-visible' : ''
      } ${isRemoving ? 'notification-removing' : ''}`}
    >
      {/* 图标 */}
      {notification.icon && (
        <div className="notification-icon">
          <span>{notification.icon}</span>
        </div>
      )}

      {/* 内容 */}
      <div className="notification-content">
        <div className="notification-header">
          <h4 className="notification-title">{notification.title}</h4>
          <span className="notification-time">
            {formatTime(notification.timestamp)}
          </span>
        </div>
        
        <p className="notification-message">{notification.message}</p>
        
        {/* 动作按钮 */}
        {notification.action && (
          <button 
            className="notification-action"
            onClick={handleActionClick}
          >
            {notification.action.label}
          </button>
        )}
      </div>

      {/* 关闭按钮 */}
      <button 
        className="notification-close"
        onClick={handleRemove}
        aria-label="关闭通知"
      >
        ×
      </button>

      {/* 进度条（如果设置了自动移除） */}
      {notification.autoRemove !== false && notification.duration && (
        <div 
          className="notification-progress"
          style={{
            animationDuration: `${notification.duration}ms`
          }}
        />
      )}
    </div>
  );
} 