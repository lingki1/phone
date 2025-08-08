'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// AI异步状态类型定义
interface PendingTask {
  pending: true;
  timestamp: number;
}

interface AiPendingState {
  [chatId: string]: boolean | PendingTask;
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
        const parsed = saved ? JSON.parse(saved) : {};
        
        // 清理可能卡住的任务（超过5分钟的任务）
        const now = Date.now();
        const cleaned = Object.entries(parsed).reduce<AiPendingState>((acc, [chatId, pending]) => {
          if (pending && typeof pending === 'object' && 'timestamp' in pending) {
            const pendingTask = pending as PendingTask;
            // 如果任务超过5分钟，自动清理
            if (now - pendingTask.timestamp > 5 * 60 * 1000) {
              console.log(`自动清理超时的AI任务: ${chatId}`);
              return acc;
            }
            return { ...acc, [chatId]: pendingTask };
          }
          return { ...acc, [chatId]: pending as boolean | PendingTask };
        }, {});
        
        return cleaned;
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
      const currentState = prev[chatId];
      const newPendingState: boolean | PendingTask = pending ? { pending: true, timestamp: Date.now() } : false;
      
      if (currentState === newPendingState) {
        return prev; // 避免不必要的重渲染
      }
      
      const newState = { ...prev, [chatId]: newPendingState };
      
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
    const state = aiPending[chatId];
    if (typeof state === 'boolean') {
      return state; // 兼容旧数据格式
    }
    if (state && typeof state === 'object' && state.pending) {
      return true;
    }
    return false;
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

  // 定期清理超时的AI任务
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setAiPendingState(prev => {
        const now = Date.now();
        const cleaned = Object.entries(prev).reduce<AiPendingState>((acc, [chatId, state]) => {
          if (state && typeof state === 'object' && 'timestamp' in state) {
            const pendingTask = state as PendingTask;
            // 如果任务超过5分钟，自动清理
            if (now - pendingTask.timestamp > 5 * 60 * 1000) {
              console.log(`定期清理超时的AI任务: ${chatId}`);
              return acc;
            }
          }
          return { ...acc, [chatId]: state };
        }, {});

        if (Object.keys(cleaned).length !== Object.keys(prev).length) {
          // 保存到localStorage
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('aiPendingState', JSON.stringify(cleaned));
            } catch (error) {
              console.error('Failed to save cleaned AI pending state to localStorage:', error);
            }
          }
        }

        return cleaned;
      });
    }, 60000); // 每分钟检查一次

    return () => clearInterval(cleanupInterval);
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