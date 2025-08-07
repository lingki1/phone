'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, ChatItem } from '../../../types/chat';
import { dataManager } from '../../../utils/dataManager';
import './MessagePaginationManager.css';

interface MessagePaginationManagerProps {
  chat: ChatItem;
  onLoadMoreMessages: (messages: Message[]) => void;
  onUpdateScrollPosition: (oldHeight: number, newHeight: number) => void;
  isEnabled?: boolean;
}

interface PaginationState {
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;
  pageSize: number;
  totalLoaded: number;
}

export default function MessagePaginationManager({
  chat,
  onLoadMoreMessages,
  onUpdateScrollPosition,
  isEnabled = true
}: MessagePaginationManagerProps) {
  const [paginationState, setPaginationState] = useState<PaginationState>({
    isLoading: false,
    hasMore: true,
    currentPage: 0,
    pageSize: 20, // 每次加载20条消息
    totalLoaded: 0
  });

  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 初始化分页状态
  useEffect(() => {
    if (!isEnabled) return;

    const initializePagination = async () => {
      try {
        await dataManager.initDB();
        const totalMessages = await dataManager.getChatMessageCount(chat.id);
        
        console.log('Pagination initialized:', {
          totalMessages,
          currentMessages: chat.messages.length,
          hasMore: totalMessages > chat.messages.length
        });
        
        setPaginationState(prev => ({
          ...prev,
          hasMore: totalMessages > chat.messages.length,
          totalLoaded: chat.messages.length
        }));
      } catch (error) {
        console.error('Failed to initialize pagination:', error);
      }
    };

    initializePagination();
  }, [chat.id, chat.messages.length, isEnabled]);

  // 加载更多历史消息
  const loadMoreMessages = useCallback(async () => {
    if (paginationState.isLoading || !paginationState.hasMore || !isEnabled) {
      console.log('Load more blocked:', {
        isLoading: paginationState.isLoading,
        hasMore: paginationState.hasMore,
        isEnabled
      });
      return;
    }

    console.log('Loading more messages...');
    setPaginationState(prev => ({ ...prev, isLoading: true }));

    try {
      await dataManager.initDB();
      
      // 获取当前消息列表中最旧消息的时间戳
      const oldestMessageTimestamp = chat.messages.length > 0 
        ? Math.min(...chat.messages.map(msg => msg.timestamp))
        : Date.now();

      // 从数据库加载更早的消息
      const olderMessages = await dataManager.getChatMessagesBefore(
        chat.id,
        oldestMessageTimestamp,
        paginationState.pageSize
      );

      if (olderMessages.length > 0) {
        console.log('Loaded older messages:', olderMessages.length);
        
        // 记录滚动位置
        const messagesContainer = document.querySelector('.messages-container') as HTMLElement;
        const oldScrollHeight = messagesContainer?.scrollHeight || 0;

        // 更新消息列表（将新消息插入到开头）
        onLoadMoreMessages(olderMessages);

        // 更新滚动位置
        if (messagesContainer) {
          const newScrollHeight = messagesContainer.scrollHeight;
          onUpdateScrollPosition(oldScrollHeight, newScrollHeight);
        }

        // 更新分页状态
        setPaginationState(prev => ({
          ...prev,
          currentPage: prev.currentPage + 1,
          totalLoaded: prev.totalLoaded + olderMessages.length,
          hasMore: olderMessages.length === prev.pageSize
        }));
      } else {
        console.log('No more messages to load');
        // 没有更多消息了
        setPaginationState(prev => ({ ...prev, hasMore: false }));
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setPaginationState(prev => ({ ...prev, isLoading: false }));
    }
  }, [chat.id, chat.messages, paginationState, onLoadMoreMessages, onUpdateScrollPosition, isEnabled]);

  // 设置交叉观察器
  useEffect(() => {
    if (!isEnabled || !loadMoreTriggerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && paginationState.hasMore && !paginationState.isLoading) {
          loadMoreMessages();
        }
      },
      {
        root: null, // 使用viewport作为root
        rootMargin: '200px', // 提前200px触发加载
        threshold: 0.1
      }
    );

    observerRef.current.observe(loadMoreTriggerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreMessages, paginationState.hasMore, paginationState.isLoading, isEnabled]);

  // 手动加载更多按钮
  const handleManualLoadMore = () => {
    loadMoreMessages();
  };

  if (!isEnabled || !paginationState.hasMore) {
    return null;
  }

  return (
    <div className="message-pagination-manager">
      {/* 加载触发器（用于自动检测） */}
      <div ref={loadMoreTriggerRef} className="load-more-trigger" />
      
      {/* 手动加载按钮 */}
      <div className="load-more-button-container">
        <button
          className="load-more-button"
          onClick={handleManualLoadMore}
          disabled={paginationState.isLoading}
        >
          {paginationState.isLoading ? (
            <>
              <div className="loading-spinner"></div>
              <span>加载中...</span>
            </>
          ) : (
            <>
              <span>加载更多消息</span>
              <span className="message-count">
                (已加载 {paginationState.totalLoaded} 条)
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 