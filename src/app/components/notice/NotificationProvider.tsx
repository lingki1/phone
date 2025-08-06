'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NotificationContainer from './NotificationContainer';
import { NotificationItem } from './types';

interface NotificationContextType {
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // 添加通知
  const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // 自动移除通知（如果设置了自动移除）
    if (notification.autoRemove !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration || 5000);
    }
  };

  // 移除通知
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // 清空所有通知
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // 监听全局事件
  useEffect(() => {
    // 监听AI动态生成事件
    const handleAiPostGenerated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { post } = customEvent.detail;
      
      addNotification({
        type: 'success',
        title: '新动态生成',
        message: `${post.authorName} 发布了新动态`,
        icon: '📝',
        action: {
          label: '查看',
          onClick: () => {
            // 跳转到动态页面
            window.dispatchEvent(new CustomEvent('navigateToMoments'));
          }
        }
      });
    };

    // 监听AI评论生成事件
    const handleAiCommentsGenerated = (event: Event) => {
      const customEvent = event as CustomEvent;
      // const { postId } = customEvent.detail;
      
      addNotification({
        type: 'info',
        title: '新评论生成',
        message: 'AI角色对动态发表了评论',
        icon: '💬',
        action: {
          label: '查看',
          onClick: () => {
            // 跳转到动态页面
            window.dispatchEvent(new CustomEvent('navigateToMoments'));
          }
        }
      });
    };

    // 监听聊天消息生成事件（预留）
    const handleChatMessageGenerated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { characterName } = customEvent.detail;
      
      addNotification({
        type: 'info',
        title: '新消息',
        message: `${characterName} 发送了新消息`,
        icon: '💌',
        action: {
          label: '查看',
          onClick: () => {
            // 跳转到聊天页面
            window.dispatchEvent(new CustomEvent('navigateToChat'));
          }
        }
      });
    };

    // 监听错误事件
    const handleError = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { error } = customEvent.detail;
      
      addNotification({
        type: 'error',
        title: '操作失败',
        message: error.message || '发生未知错误',
        icon: '❌',
        duration: 8000, // 错误通知显示更长时间
        action: {
          label: '重试',
          onClick: () => {
            // 可以触发重试逻辑
            console.log('Retry action triggered');
          }
        }
      });
    };

    // 添加事件监听器
    window.addEventListener('aiPostGenerated', handleAiPostGenerated);
    window.addEventListener('aiCommentsGenerated', handleAiCommentsGenerated);
    window.addEventListener('chatMessageGenerated', handleChatMessageGenerated);
    window.addEventListener('notificationError', handleError);

    // 清理函数
    return () => {
      window.removeEventListener('aiPostGenerated', handleAiPostGenerated);
      window.removeEventListener('aiCommentsGenerated', handleAiCommentsGenerated);
      window.removeEventListener('chatMessageGenerated', handleChatMessageGenerated);
      window.removeEventListener('notificationError', handleError);
    };
  }, []);

  const contextValue: NotificationContextType = {
    addNotification,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
        onClearAll={clearAllNotifications}
      />
    </NotificationContext.Provider>
  );
}

// Hook for using notifications
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 