'use client';

import { useCallback } from 'react';
import { useAiPending } from './AiPendingProvider';

/**
 * AI异步状态管理的自定义Hook
 * 提供便捷的状态管理方法
 */
export const useAiPendingState = (chatId: string) => {
  const { setAiPending, isAiPending, clearAiPending } = useAiPending();

  // 当前聊天是否有AI异步任务
  const isPending = isAiPending(chatId);

  // 开始AI异步任务
  const startAiTask = useCallback(() => {
    setAiPending(chatId, true);
  }, [chatId, setAiPending]);

  // 结束AI异步任务
  const endAiTask = useCallback(() => {
    setAiPending(chatId, false);
  }, [chatId, setAiPending]);

  // 清除AI异步状态
  const clearPending = useCallback(() => {
    clearAiPending(chatId);
  }, [chatId, clearAiPending]);

  // 执行AI任务（自动管理状态）
  const executeAiTask = useCallback(async <T>(
    task: () => Promise<T>
  ): Promise<T> => {
    try {
      startAiTask();
      const result = await task();
      return result;
    } finally {
      endAiTask();
    }
  }, [startAiTask, endAiTask]);

  return {
    isPending,
    startAiTask,
    endAiTask,
    clearPending,
    executeAiTask
  };
};

export default useAiPendingState; 