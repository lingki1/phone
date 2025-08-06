'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// AI异步状态类型定义
interface AiPendingState {
  [chatId: string]: boolean;
}

// Context类型定义
interface AiPendingContextType {
  aiPending: AiPendingState;
  setAiPending: (chatId: string, pending: boolean) => void;
  isAiPending: (chatId: string) => boolean;
  clearAiPending: (chatId: string) => void;
  clearAllAiPending: () => void;
}

// 创建Context
const AiPendingContext = createContext<AiPendingContextType | undefined>(undefined);

// Provider组件Props
interface AiPendingProviderProps {
  children: ReactNode;
}

// Provider组件
export const AiPendingProvider: React.FC<AiPendingProviderProps> = ({ children }) => {
  // 从localStorage初始化状态
  const [aiPending, setAiPendingState] = useState<AiPendingState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aiPendingState');
        return saved ? JSON.parse(saved) : {};
      } catch (error) {
        console.error('Failed to load AI pending state from localStorage:', error);
        return {};
      }
    }
    return {};
  });

  // 设置指定聊天的AI异步状态
  const setAiPending = useCallback((chatId: string, pending: boolean) => {
    setAiPendingState(prev => {
      if (prev[chatId] === pending) {
        return prev; // 避免不必要的重渲染
      }
      const newState = { ...prev, [chatId]: pending };
      
      // 保存到localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aiPendingState', JSON.stringify(newState));
        } catch (error) {
          console.error('Failed to save AI pending state to localStorage:', error);
        }
      }
      
      return newState;
    });
  }, []);

  // 检查指定聊天是否有AI异步任务
  const isAiPending = useCallback((chatId: string): boolean => {
    return !!aiPending[chatId];
  }, [aiPending]);

  // 清除指定聊天的AI异步状态
  const clearAiPending = useCallback((chatId: string) => {
    setAiPendingState(prev => {
      const newState = { ...prev };
      delete newState[chatId];
      
      // 保存到localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('aiPendingState', JSON.stringify(newState));
        } catch (error) {
          console.error('Failed to save AI pending state to localStorage:', error);
        }
      }
      
      return newState;
    });
  }, []);

  // 清除所有AI异步状态
  const clearAllAiPending = useCallback(() => {
    setAiPendingState({});
    
    // 清除localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('aiPendingState');
      } catch (error) {
        console.error('Failed to clear AI pending state from localStorage:', error);
      }
    }
  }, []);

  const value: AiPendingContextType = {
    aiPending,
    setAiPending,
    isAiPending,
    clearAiPending,
    clearAllAiPending
  };

  return (
    <AiPendingContext.Provider value={value}>
      {children}
    </AiPendingContext.Provider>
  );
};

// Hook for using AI pending context
export const useAiPending = (): AiPendingContextType => {
  const context = useContext(AiPendingContext);
  if (!context) {
    throw new Error('useAiPending must be used within AiPendingProvider');
  }
  return context;
};

// 导出类型
export type { AiPendingState, AiPendingContextType }; 