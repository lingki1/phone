'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  // 修改为单一通知状态，而不是数组
  const [currentNotification, setCurrentNotification] = useState<NotificationItem | null>(null);

  // 移除通知
  const removeNotification = useCallback((id: string) => {
    setCurrentNotification(prev => prev?.id === id ? null : prev);
  }, []);

  // 添加通知
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    // 新通知直接覆盖旧通知
    setCurrentNotification(newNotification);

    // 自动移除通知（如果设置了自动移除）
    if (notification.autoRemove !== false) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, notification.duration || 5000);
    }
  }, [removeNotification]);

  // 清空所有通知
  const clearAllNotifications = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  // 检查是否应该抑制通知
  const shouldSuppressNotification = useCallback((chatId?: string) => {
    // 如果当前在聊天页面，且通知来自同一个聊天，则抑制通知
    if (typeof window !== 'undefined' && window.currentActiveChatId && chatId) {
      return window.currentActiveChatId === chatId;
    }
    return false;
  }, []);

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
    const handleAiCommentsGenerated = () => {
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

    // 监听聊天消息生成事件 - 添加聊天页面检测
    const handleChatMessageGenerated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { characterName, chatId, messageContent } = customEvent.detail;
      
      // 如果当前在对应的聊天页面，不显示通知
      if (shouldSuppressNotification(chatId)) {
        return;
      }
      
      addNotification({
        type: 'info',
        title: '新消息',
        message: `${characterName}: ${messageContent?.substring(0, 30) || '发送了新消息'}${messageContent && messageContent.length > 30 ? '...' : ''}`,
        icon: '💌',
        action: {
          label: '查看',
          onClick: () => {
            // 跳转到特定聊天
            window.dispatchEvent(new CustomEvent('openChat', { 
              detail: { chatId } 
            }));
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
  }, [addNotification, shouldSuppressNotification]);

  const contextValue: NotificationContextType = {
    addNotification,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer 
        notification={currentNotification}
        onRemove={removeNotification}
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